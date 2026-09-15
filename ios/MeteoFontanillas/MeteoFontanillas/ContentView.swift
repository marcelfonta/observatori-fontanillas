import SwiftUI

@MainActor
final class MeteoViewModel: ObservableObject {
    @Published var snapshot: MeteoSnapshot?
    @Published var errorMessage: String?
    @Published var isLoading = false

    func refresh() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            snapshot = try await MeteoService.shared.loadSnapshot()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct ContentView: View {
    @StateObject private var model = MeteoViewModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(red: 0.01, green: 0.10, blue: 0.08), Color(red: 0.05, green: 0.23, blue: 0.16)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        brand
                        currentCard
                        widgetGuide
                        Link(destination: URL(string: "https://meteo.fontanillas.cat/")!) {
                            Label("Obrir la web completa", systemImage: "safari")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(.white.opacity(0.12), in: RoundedRectangle(cornerRadius: 18))
                        }
                    }
                    .padding(20)
                }
            }
            .foregroundStyle(.white)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await model.refresh() }
                    } label: {
                        if model.isLoading {
                            ProgressView().tint(.white)
                        } else {
                            Image(systemName: "arrow.clockwise")
                        }
                    }
                    .accessibilityLabel("Actualitza les dades")
                }
            }
        }
        .task { await model.refresh() }
        .onChange(of: scenePhase) { phase in
            if phase == .active { Task { await model.refresh() } }
        }
    }

    private var brand: some View {
        HStack(spacing: 12) {
            Image("ObservatoriLogo")
                .resizable()
                .scaledToFit()
                .frame(width: 58, height: 58)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            VStack(alignment: .leading, spacing: 3) {
                Text("Meteo Fontanillas").font(.title2.bold())
                Text("Observatori meteorològic · Sant Celoni")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.7))
            }
        }
    }

    @ViewBuilder
    private var currentCard: some View {
        if let snapshot = model.snapshot {
            VStack(alignment: .leading, spacing: 18) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(MeteoFormatting.temperature(snapshot.observation.temperature))
                            .font(.system(size: 68, weight: .bold, design: .rounded))
                        Text(MeteoFormatting.freshness(for: snapshot.observation))
                            .font(.caption)
                            .foregroundStyle(snapshot.isDegraded ? .yellow : .white.opacity(0.7))
                    }
                    Spacer()
                    Image(systemName: MeteoFormatting.symbol(for: snapshot.forecast?.weatherCode))
                        .font(.system(size: 40))
                        .symbolRenderingMode(.multicolor)
                }

                if let forecast = snapshot.forecast {
                    Text(MeteoFormatting.condition(for: forecast.weatherCode))
                        .font(.title3.bold())
                    HStack(spacing: 18) {
                        Label("Màx. \(MeteoFormatting.temperature(forecast.temperatureMax))", systemImage: "thermometer.sun")
                        Label("Mín. \(MeteoFormatting.temperature(forecast.temperatureMin))", systemImage: "thermometer.snowflake")
                    }
                    .font(.subheadline)
                    Label("Pluja \(MeteoFormatting.precipitation(forecast.precipitationProbability))", systemImage: "drop.fill")
                        .font(.subheadline)
                }
            }
            .padding(22)
            .background(.black.opacity(0.20), in: RoundedRectangle(cornerRadius: 26))
            .overlay {
                RoundedRectangle(cornerRadius: 26).stroke(.white.opacity(0.15))
            }
        } else if let errorMessage = model.errorMessage {
            VStack(spacing: 12) {
                Image(systemName: "wifi.exclamationmark")
                    .font(.largeTitle)
                Text("No s’han pogut carregar les dades")
                    .font(.headline)
                Text(errorMessage)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.72))
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(24)
            .background(.black.opacity(0.20), in: RoundedRectangle(cornerRadius: 26))
        } else {
            ProgressView("Carregant l’estació…").tint(.white)
        }
    }

    private var widgetGuide: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Afegeix el widget").font(.headline)
            Text("Mantén premuda la pantalla bloquejada, toca Personalitza → Pantalla bloquejada → Afegeix widgets i tria Meteo Fontanillas.")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.78))
        }
    }
}
