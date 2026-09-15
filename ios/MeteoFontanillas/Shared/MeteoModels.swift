import Foundation

struct StationObservation: Decodable, Equatable {
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

struct OpenMeteoForecast: Decodable, Equatable {
    struct Daily: Decodable, Equatable {
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
}

struct DailyForecast: Equatable {
    let date: String
    let weatherCode: Int?
    let temperatureMax: Double?
    let temperatureMin: Double?
    let precipitationProbability: Int?
}

struct MeteoSnapshot: Equatable {
    let observation: StationObservation
    let forecast: DailyForecast?
    let fetchedAt: Date

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
