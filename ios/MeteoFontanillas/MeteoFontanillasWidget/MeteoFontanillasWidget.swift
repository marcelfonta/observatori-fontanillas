import SwiftUI
import WidgetKit
import OSLog

struct MeteoEntry: TimelineEntry {
    let date: Date
    let snapshot: MeteoSnapshot?
    let failed: Bool
    let cached: Bool

    static let placeholder = MeteoEntry(
        date: Date(),
        snapshot: MeteoSnapshot(
            observation: StationObservation(
                station: "Observatori Meteorològic Fontanillas",
                location: "Sant Celoni · Montseny",
                updated: nil,
                updatedUtc: nil,
                epoch: nil,
                temperature: 18.6,
                feelsLike: 18.4,
                humidity: 64,
                degraded: false,
                stale: false,
                ageMinutes: 0
            ),
            forecast: DailyForecast(
                date: "2026-09-15",
                weatherCode: 2,
                temperatureMax: 24,
                temperatureMin: 14,
                precipitationProbability: 20
            ),
            forecasts: [
                DailyForecast(date: "2026-09-15", weatherCode: 2, temperatureMax: 24, temperatureMin: 14, precipitationProbability: 20),
                DailyForecast(date: "2026-09-16", weatherCode: 1, temperatureMax: 25, temperatureMin: 13, precipitationProbability: 10),
                DailyForecast(date: "2026-09-17", weatherCode: 61, temperatureMax: 22, temperatureMin: 15, precipitationProbability: 70),
                DailyForecast(date: "2026-09-18", weatherCode: 3, temperatureMax: 21, temperatureMin: 14, precipitationProbability: 35),
                DailyForecast(date: "2026-09-19", weatherCode: 0, temperatureMax: 24, temperatureMin: 12, precipitationProbability: 5)
            ],
            fetchedAt: Date()
        ),
        failed: false,
        cached: false
    )
}

private enum WidgetSnapshotCache {
    private static let key = "meteo-fontanillas-widget-snapshot-v1"
    private static let maximumAge: TimeInterval = 90 * 60

    static func save(_ snapshot: MeteoSnapshot) {
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        UserDefaults.standard.set(data, forKey: key)
    }

    static func load(now: Date = Date()) -> MeteoSnapshot? {
        guard
            let data = UserDefaults.standard.data(forKey: key),
            let snapshot = try? JSONDecoder().decode(MeteoSnapshot.self, from: data),
            now.timeIntervalSince(snapshot.fetchedAt) <= maximumAge
        else { return nil }
        return snapshot
    }
}

struct MeteoProvider: TimelineProvider {
    private let logger = Logger(subsystem: "cat.fontanillas.meteo.widget", category: "timeline")

    func placeholder(in context: Context) -> MeteoEntry { .placeholder }

    func getSnapshot(in context: Context, completion: @escaping (MeteoEntry) -> Void) {
        guard !context.isPreview else {
            completion(.placeholder)
            return
        }
        load(completion: completion)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MeteoEntry>) -> Void) {
        Task {
            let entry = await loadEntry()
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: entry.failed || entry.cached ? 5 : 20, to: Date())!
            completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
        }
    }

    private func load(completion: @escaping (MeteoEntry) -> Void) {
        Task {
            completion(await loadEntry())
        }
    }

    private func loadEntry() async -> MeteoEntry {
        do {
            let snapshot = try await MeteoService.shared.loadWidgetSnapshot()
            WidgetSnapshotCache.save(snapshot)
            return MeteoEntry(date: Date(), snapshot: snapshot, failed: false, cached: false)
        } catch {
            logger.error("No s'ha pogut actualitzar el widget: \(error.localizedDescription, privacy: .public)")
            if let cached = WidgetSnapshotCache.load() {
                return MeteoEntry(date: Date(), snapshot: cached, failed: false, cached: true)
            }
            return MeteoEntry(date: Date(), snapshot: nil, failed: true, cached: false)
        }
    }
}

struct MeteoWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: MeteoEntry

    var body: some View {
        Group {
            if let snapshot = entry.snapshot {
                switch family {
                case .accessoryInline:
                    inline(snapshot)
                case .accessoryCircular:
                    circular(snapshot)
                case .accessoryRectangular:
                    rectangular(snapshot)
                case .systemMedium:
                    medium(snapshot)
                case .systemLarge:
                    large(snapshot)
                default:
                    small(snapshot)
                }
            } else {
                unavailable
            }
        }
        .widgetURL(URL(string: "meteofontanillas://estacio"))
    }

    private func inline(_ snapshot: MeteoSnapshot) -> some View {
        Label {
            Text(entry.cached
                 ? "Sant Celoni \(MeteoFormatting.temperature(snapshot.observation.temperature)) · lectura desada"
                 : "Sant Celoni \(MeteoFormatting.temperature(snapshot.observation.temperature)) · \(MeteoFormatting.condition(for: snapshot.forecast?.weatherCode))")
        } icon: {
            Image(systemName: MeteoFormatting.symbol(for: snapshot.forecast?.weatherCode))
        }
    }

    private func circular(_ snapshot: MeteoSnapshot) -> some View {
        Gauge(value: snapshot.observation.temperature ?? 0, in: -10...45) {
            Image(systemName: "thermometer.medium")
        } currentValueLabel: {
            Text(MeteoFormatting.temperature(snapshot.observation.temperature))
                .font(.system(.body, design: .rounded).bold())
                .minimumScaleFactor(0.7)
        }
        .gaugeStyle(.accessoryCircular)
    }

    private func rectangular(_ snapshot: MeteoSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Image(systemName: MeteoFormatting.symbol(for: snapshot.forecast?.weatherCode))
                Text(MeteoFormatting.temperature(snapshot.observation.temperature)).font(.headline)
                Spacer(minLength: 2)
                if snapshot.isDegraded || entry.cached {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .accessibilityLabel("Lectura degradada")
                }
            }
            Text(entry.cached ? "Darrera lectura guardada" : MeteoFormatting.condition(for: snapshot.forecast?.weatherCode))
                .font(.caption)
                .lineLimit(1)
            HStack(spacing: 8) {
                Text("↑\(MeteoFormatting.temperature(snapshot.forecast?.temperatureMax))")
                Text("↓\(MeteoFormatting.temperature(snapshot.forecast?.temperatureMin))")
                Text("☂︎\(MeteoFormatting.precipitation(snapshot.forecast?.precipitationProbability))")
            }
            .font(.caption2)
        }
    }

    private func small(_ snapshot: MeteoSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: MeteoFormatting.symbol(for: snapshot.forecast?.weatherCode))
                    .symbolRenderingMode(.multicolor)
                Spacer()
                if snapshot.isDegraded || entry.cached {
                    Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.yellow)
                }
            }
            Text(MeteoFormatting.temperature(snapshot.observation.temperature))
                .font(.system(size: 38, weight: .bold, design: .rounded))
            Text(MeteoFormatting.condition(for: snapshot.forecast?.weatherCode))
                .font(.caption)
                .lineLimit(2)
            Text("Màx. \(MeteoFormatting.temperature(snapshot.forecast?.temperatureMax)) · Mín. \(MeteoFormatting.temperature(snapshot.forecast?.temperatureMin))")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private func medium(_ snapshot: MeteoSnapshot) -> some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 7) {
                Text("SANT CELONI")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .tracking(1.1)

                HStack(alignment: .center, spacing: 9) {
                    Image(systemName: MeteoFormatting.symbol(for: snapshot.forecast?.weatherCode))
                        .font(.system(size: 29))
                        .symbolRenderingMode(.multicolor)
                    Text(MeteoFormatting.temperature(snapshot.observation.temperature))
                        .font(.system(size: 42, weight: .bold, design: .rounded))
                        .minimumScaleFactor(0.75)
                }

                Text(MeteoFormatting.condition(for: snapshot.forecast?.weatherCode))
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)

                Label {
                    Text(entry.cached ? "Lectura guardada" : MeteoFormatting.freshness(for: snapshot.observation))
                } icon: {
                    Image(systemName: entry.cached ? "clock.arrow.circlepath" : "dot.radiowaves.left.and.right")
                }
                .font(.caption2)
                .foregroundStyle(entry.cached || snapshot.isDegraded ? .orange : .secondary)
                .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Divider()

            VStack(spacing: 8) {
                metricRow(
                    title: "Sensació",
                    value: MeteoFormatting.temperature(snapshot.observation.feelsLike),
                    symbol: "thermometer.medium"
                )
                metricRow(
                    title: "Humitat",
                    value: MeteoFormatting.humidity(snapshot.observation.humidity),
                    symbol: "humidity.fill"
                )
                metricRow(
                    title: "Avui",
                    value: "↑\(MeteoFormatting.temperature(snapshot.forecast?.temperatureMax))  ↓\(MeteoFormatting.temperature(snapshot.forecast?.temperatureMin))",
                    symbol: "calendar"
                )
                metricRow(
                    title: "Pluja",
                    value: MeteoFormatting.precipitation(snapshot.forecast?.precipitationProbability),
                    symbol: "umbrella.fill"
                )
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.vertical, 2)
    }

    private func metricRow(title: String, value: String, symbol: String) -> some View {
        HStack(spacing: 7) {
            Image(systemName: symbol)
                .frame(width: 17)
                .foregroundStyle(.secondary)
            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Spacer(minLength: 4)
            Text(value)
                .font(.caption.weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
    }

    private func large(_ snapshot: MeteoSnapshot) -> some View {
        let nextDays = Array(snapshot.forecastDays.dropFirst().prefix(4))

        return VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 18) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("SANT CELONI · ARA")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .tracking(1.1)

                    HStack(spacing: 10) {
                        Image(systemName: MeteoFormatting.symbol(for: snapshot.forecast?.weatherCode))
                            .font(.system(size: 36))
                            .symbolRenderingMode(.multicolor)
                        Text(MeteoFormatting.temperature(snapshot.observation.temperature))
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .minimumScaleFactor(0.75)
                    }

                    Text(MeteoFormatting.condition(for: snapshot.forecast?.weatherCode))
                        .font(.headline)
                        .lineLimit(1)

                    Label {
                        Text(entry.cached ? "Lectura guardada" : MeteoFormatting.freshness(for: snapshot.observation))
                    } icon: {
                        Image(systemName: entry.cached ? "clock.arrow.circlepath" : "dot.radiowaves.left.and.right")
                    }
                    .font(.caption2)
                    .foregroundStyle(entry.cached || snapshot.isDegraded ? .orange : .secondary)
                    .lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                VStack(spacing: 10) {
                    HStack(spacing: 10) {
                        compactMetric(
                            title: "Sensació",
                            value: MeteoFormatting.temperature(snapshot.observation.feelsLike),
                            symbol: "thermometer.medium"
                        )
                        compactMetric(
                            title: "Humitat",
                            value: MeteoFormatting.humidity(snapshot.observation.humidity),
                            symbol: "humidity.fill"
                        )
                    }
                    HStack(spacing: 10) {
                        compactMetric(
                            title: "Màx. / mín.",
                            value: "\(MeteoFormatting.temperature(snapshot.forecast?.temperatureMax)) / \(MeteoFormatting.temperature(snapshot.forecast?.temperatureMin))",
                            symbol: "calendar"
                        )
                        compactMetric(
                            title: "Pluja",
                            value: MeteoFormatting.precipitation(snapshot.forecast?.precipitationProbability),
                            symbol: "umbrella.fill"
                        )
                    }
                }
                .frame(maxWidth: .infinity)
            }

            Divider()

            Text("PROPERS 4 DIES")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
                .tracking(1.1)

            if nextDays.isEmpty {
                Label("Previsió dels pròxims dies no disponible", systemImage: "calendar.badge.exclamationmark")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                HStack(spacing: 8) {
                    ForEach(nextDays, id: \.date) { forecast in
                        forecastCard(forecast)
                    }
                }
            }
        }
        .padding(.vertical, 2)
    }

    private func compactMetric(title: String, value: String, symbol: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Label(title, systemImage: symbol)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            Text(value)
                .font(.subheadline.weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(9)
        .background(.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
    }

    private func forecastCard(_ forecast: DailyForecast) -> some View {
        VStack(spacing: 7) {
            Text(MeteoFormatting.shortDay(forecast.date))
                .font(.caption.weight(.semibold))
            Image(systemName: MeteoFormatting.symbol(for: forecast.weatherCode))
                .font(.title2)
                .symbolRenderingMode(.multicolor)
            Text("↑\(MeteoFormatting.temperature(forecast.temperatureMax))")
                .font(.caption.weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            Text("↓\(MeteoFormatting.temperature(forecast.temperatureMin))")
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            Label(MeteoFormatting.precipitation(forecast.precipitationProbability), systemImage: "umbrella.fill")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 13))
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            "\(MeteoFormatting.shortDay(forecast.date)), \(MeteoFormatting.condition(for: forecast.weatherCode)), màxima \(MeteoFormatting.temperature(forecast.temperatureMax)), mínima \(MeteoFormatting.temperature(forecast.temperatureMin)), pluja \(MeteoFormatting.precipitation(forecast.precipitationProbability))"
        )
    }

    private var unavailable: some View {
        Label("Dades no disponibles", systemImage: "wifi.exclamationmark")
            .font(.caption)
    }
}

struct MeteoFontanillasWidget: Widget {
    let kind = "MeteoFontanillasWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MeteoProvider()) { entry in
            if #available(iOS 17.0, *) {
                MeteoWidgetView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                MeteoWidgetView(entry: entry)
                    .padding()
            }
        }
        .configurationDisplayName("Meteo Fontanillas")
        .description("Dades de l’estació i previsió fins als pròxims quatre dies a Sant Celoni.")
        .supportedFamilies([.accessoryInline, .accessoryCircular, .accessoryRectangular, .systemSmall, .systemMedium, .systemLarge])
    }
}

@main
struct MeteoFontanillasWidgetBundle: WidgetBundle {
    var body: some Widget {
        MeteoFontanillasWidget()
    }
}
