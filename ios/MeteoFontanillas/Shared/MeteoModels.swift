import Foundation

struct StationObservation: Codable, Equatable {
    let station: String
    let location: String
    let updated: String?
    let updatedUtc: String?
    let epoch: TimeInterval?
    let temperature: Double?
    let feelsLike: Double?
    let humidity: Double?
    let degraded: Bool?
    let stale: Bool?
    let ageMinutes: Int?
}

struct OpenMeteoForecast: Codable, Equatable {
    struct Current: Codable, Equatable {
        let time: String
        let weatherCode: Int?

        enum CodingKeys: String, CodingKey {
            case time
            case weatherCode = "weather_code"
        }
    }

    struct Hourly: Codable, Equatable {
        let time: [String]
        let precipitationProbability: [Int?]

        enum CodingKeys: String, CodingKey {
            case time
            case precipitationProbability = "precipitation_probability"
        }
    }

    struct Daily: Codable, Equatable {
        let time: [String]
        let weatherCode: [Int?]
        let temperatureMax: [Double?]
        let temperatureMin: [Double?]
        let precipitationProbability: [Int?]

        enum CodingKeys: String, CodingKey {
            case time
            case weatherCode = "weather_code"
            case temperatureMax = "temperature_2m_max"
            case temperatureMin = "temperature_2m_min"
            case precipitationProbability = "precipitation_probability_max"
        }
    }

    let daily: Daily
    let current: Current?
    let hourly: Hourly?

    func remainingToday(at localTime: String) -> (weatherCode: Int?, rainProbability: Int?) {
        let today = String(localTime.prefix(10))
        let remaining = hourly?.time.enumerated().compactMap { index, time -> Int? in
            guard time.hasPrefix(today), time >= localTime else { return nil }
            guard let probabilities = hourly?.precipitationProbability,
                  probabilities.indices.contains(index) else { return nil }
            return probabilities[index]
        }
        return (current?.weatherCode, remaining?.max())
    }
}

struct DailyForecast: Codable, Equatable {
    let date: String
    let weatherCode: Int?
    let temperatureMax: Double?
    let temperatureMin: Double?
    let precipitationProbability: Int?
}

struct MeteoSnapshot: Codable, Equatable {
    let observation: StationObservation
    let forecast: DailyForecast?
    let forecasts: [DailyForecast]?
    let fetchedAt: Date

    init(
        observation: StationObservation,
        forecast: DailyForecast?,
        forecasts: [DailyForecast]? = nil,
        fetchedAt: Date
    ) {
        self.observation = observation
        self.forecast = forecast
        self.forecasts = forecasts
        self.fetchedAt = fetchedAt
    }

    var forecastDays: [DailyForecast] {
        if let forecasts, !forecasts.isEmpty { return forecasts }
        return forecast.map { [$0] } ?? []
    }

    var isDegraded: Bool {
        observation.degraded == true || observation.stale == true
    }
}

enum MeteoError: LocalizedError, Equatable {
    case invalidResponse
    case httpStatus(Int)
    case missingObservation

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "La resposta meteorològica no és vàlida."
        case .httpStatus(let status):
            return "El servei meteorològic ha respost amb l’error \(status)."
        case .missingObservation:
            return "No hi ha cap lectura disponible de l’estació."
        }
    }
}
