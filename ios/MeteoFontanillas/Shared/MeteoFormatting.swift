import Foundation

enum MeteoFormatting {
    static let catalanLocale = Locale(identifier: "ca_ES")

    static func temperature(_ value: Double?) -> String {
        guard let value, value.isFinite else { return "—" }
        return value.formatted(
            .number
                .locale(catalanLocale)
                .precision(.fractionLength(1))
        ) + "°"
    }

    static func precipitation(_ value: Int?) -> String {
        guard let value else { return "—" }
        return "\(max(0, min(100, value)))%"
    }

    static func condition(for code: Int?) -> String {
        guard let code else { return "Previsió no disponible" }
        switch code {
        case 0: return "Cel serè"
        case 1: return "Majoritàriament serè"
        case 2: return "Parcialment ennuvolat"
        case 3: return "Cel cobert"
        case 45, 48: return "Boira"
        case 51, 53, 55, 56, 57: return "Plugim"
        case 61, 63, 65, 66, 67: return "Pluja"
        case 71, 73, 75, 77: return "Neu"
        case 80, 81, 82: return "Ruixats"
        case 85, 86: return "Ruixats de neu"
        case 95, 96, 99: return "Tempesta"
        default: return "Temps variable"
        }
    }

    static func symbol(for code: Int?) -> String {
        guard let code else { return "cloud.fill" }
        switch code {
        case 0: return "sun.max.fill"
        case 1, 2: return "cloud.sun.fill"
        case 3: return "cloud.fill"
        case 45, 48: return "cloud.fog.fill"
        case 51, 53, 55, 56, 57: return "cloud.drizzle.fill"
        case 61, 63, 65, 66, 67, 80, 81: return "cloud.rain.fill"
        case 82: return "cloud.heavyrain.fill"
        case 71, 73, 75, 77, 85, 86: return "cloud.snow.fill"
        case 95, 96, 99: return "cloud.bolt.rain.fill"
        default: return "cloud.sun.fill"
        }
    }

    static func freshness(for observation: StationObservation) -> String {
        if observation.stale == true || observation.degraded == true {
            if let age = observation.ageMinutes {
                return "Darrera lectura fiable · fa \(age) min"
            }
            return "Darrera lectura fiable"
        }
        return "Estació Fontanillas · ara"
    }
}
