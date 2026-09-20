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
        .description("Temperatura de l’estació i previsió d’avui a Sant Celoni.")
        .supportedFamilies([.accessoryInline, .accessoryCircular, .accessoryRectangular, .systemSmall])
    }
}

@main
struct MeteoFontanillasWidgetBundle: WidgetBundle {
    var body: some Widget {
        MeteoFontanillasWidget()
    }
}
