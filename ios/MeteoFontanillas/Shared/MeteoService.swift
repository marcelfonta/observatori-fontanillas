import Foundation

actor MeteoService {
    static let shared = MeteoService()

    private let session: URLSession
    private let decoder: JSONDecoder

    init(session: URLSession = .shared) {
        self.session = session
        self.decoder = JSONDecoder()
    }

    func loadSnapshot() async throws -> MeteoSnapshot {
        let observation = try await loadObservation()
        let forecasts = (try? await loadForecasts()) ?? []
        return MeteoSnapshot(
            observation: observation,
            forecast: forecasts.first,
            forecasts: forecasts,
            fetchedAt: Date()
        )
    }

    func loadWidgetSnapshot() async throws -> MeteoSnapshot {
        let observation: StationObservation
        do {
            observation = try await loadObservation(
                from: URL(string: "https://fonta-meteo.marcelfonta.workers.dev/widget-observation")!
            )
        } catch {
            // Compatible amb una instal·lació nova de l'app abans del desplegament del Worker.
            observation = try await loadObservation()
        }
        let forecasts = (try? await loadForecasts()) ?? []
        return MeteoSnapshot(
            observation: observation,
            forecast: forecasts.first,
            forecasts: forecasts,
            fetchedAt: Date()
        )
    }

    func loadObservation() async throws -> StationObservation {
        try await loadObservation(
            from: URL(string: "https://fonta-meteo.marcelfonta.workers.dev/")!
        )
    }

    private func loadObservation(from url: URL) async throws -> StationObservation {
        let data = try await request(url)
        let observation = try decoder.decode(StationObservation.self, from: data)
        guard observation.temperature?.isFinite == true else {
            throw MeteoError.missingObservation
        }
        return observation
    }

    func loadForecast() async throws -> DailyForecast {
        guard let forecast = try await loadForecasts(days: 1).first else {
            throw MeteoError.invalidResponse
        }
        return forecast
    }

    func loadForecasts(days: Int = 5) async throws -> [DailyForecast] {
        var components = URLComponents(string: "https://api.open-meteo.com/v1/forecast")!
        components.queryItems = [
            URLQueryItem(name: "latitude", value: "41.6906"),
            URLQueryItem(name: "longitude", value: "2.489"),
            URLQueryItem(name: "daily", value: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"),
            URLQueryItem(name: "timezone", value: "Europe/Madrid"),
            URLQueryItem(name: "forecast_days", value: String(max(1, min(7, days))))
        ]
        guard let url = components.url else { throw MeteoError.invalidResponse }
        let data = try await request(url)
        let response = try decoder.decode(OpenMeteoForecast.self, from: data)
        guard !response.daily.time.isEmpty else { throw MeteoError.invalidResponse }
        return response.daily.time.enumerated().map { index, date in
            DailyForecast(
                date: date,
                weatherCode: response.daily.weatherCode[safe: index] ?? nil,
                temperatureMax: response.daily.temperatureMax[safe: index] ?? nil,
                temperatureMin: response.daily.temperatureMin[safe: index] ?? nil,
                precipitationProbability: response.daily.precipitationProbability[safe: index] ?? nil
            )
        }
    }

    private func request(_ url: URL) async throws -> Data {
        var request = URLRequest(url: url)
        request.timeoutInterval = 12
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw MeteoError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else { throw MeteoError.httpStatus(http.statusCode) }
        return data
    }
}

private extension Array {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
