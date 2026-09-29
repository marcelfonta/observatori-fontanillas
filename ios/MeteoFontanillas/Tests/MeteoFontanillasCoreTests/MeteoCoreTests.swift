import Foundation
import Testing
@testable import MeteoFontanillasCore

@Test func decodesCurrentObservation() throws {
    let json = """
    {
      "station": "Observatori Meteorològic Fontanillas",
      "location": "Sant Celoni · Montseny",
      "updatedUtc": "2026-09-15T06:30:00Z",
      "epoch": 1789453800,
      "temperature": 18.6,
      "feelsLike": 18.4,
      "humidity": 64,
      "degraded": false,
      "stale": false,
      "ageMinutes": 0
    }
    """.data(using: .utf8)!

    let result = try JSONDecoder().decode(StationObservation.self, from: json)

    #expect(result.temperature == 18.6)
    #expect(result.degraded == false)
    #expect(MeteoFormatting.temperature(result.temperature) == "18,6°")
}

@Test func decodesForecastAndSelectsToday() throws {
    let json = """
    {
      "daily": {
        "time": ["2026-09-15"],
        "weather_code": [61],
        "temperature_2m_max": [24.2],
        "temperature_2m_min": [14.1],
        "precipitation_probability_max": [70]
      }
    }
    """.data(using: .utf8)!

    let result = try JSONDecoder().decode(OpenMeteoForecast.self, from: json)

    #expect(result.daily.weatherCode.first == 61)
    #expect(MeteoFormatting.condition(for: 61) == "Pluja")
    #expect(MeteoFormatting.precipitation(70) == "70%")
}

@Test func decodesSeveralForecastDaysSafely() throws {
    let json = """
    {
      "daily": {
        "time": ["2026-09-15", "2026-09-16", "2026-09-17"],
        "weather_code": [2, 61, 0],
        "temperature_2m_max": [24.0, 22.5, 25.1],
        "temperature_2m_min": [14.0, 15.2, 12.8],
        "precipitation_probability_max": [20, 70, 5]
      }
    }
    """.data(using: .utf8)!

    let result = try JSONDecoder().decode(OpenMeteoForecast.self, from: json)

    #expect(result.daily.time.count == 3)
    #expect(result.daily.weatherCode[1] == 61)
    #expect(MeteoFormatting.shortDay("2026-09-16") == "Dc")
    #expect(MeteoFormatting.shortDay("data-incorrecta") == "—")
}

@Test func marksFallbackAsDegraded() {
    let observation = StationObservation(
        station: "Observatori Meteorològic Fontanillas",
        location: "Sant Celoni · Montseny",
        updated: nil,
        updatedUtc: nil,
        epoch: nil,
        temperature: 17,
        feelsLike: nil,
        humidity: nil,
        degraded: true,
        stale: true,
        ageMinutes: 42
    )
    let snapshot = MeteoSnapshot(observation: observation, forecast: nil, fetchedAt: Date())

    #expect(snapshot.isDegraded)
    #expect(MeteoFormatting.freshness(for: observation) == "Darrera lectura fiable · fa 42 min")
}

@Test func clampsInvalidRainProbability() {
    #expect(MeteoFormatting.precipitation(-5) == "0%")
    #expect(MeteoFormatting.precipitation(140) == "100%")
    #expect(MeteoFormatting.precipitation(nil) == "—")
}

@Test func formatsHumidityForTheExpandedWidget() {
    #expect(MeteoFormatting.humidity(63.6) == "64%")
    #expect(MeteoFormatting.humidity(-5) == "0%")
    #expect(MeteoFormatting.humidity(140) == "100%")
    #expect(MeteoFormatting.humidity(nil) == "—")
}

@Test func snapshotCanBeStoredForWidgetFallback() throws {
    let observation = StationObservation(
        station: "Observatori Meteorològic Fontanillas",
        location: "Sant Celoni · Montseny",
        updated: nil,
        updatedUtc: "2026-09-20T17:01:23Z",
        epoch: 1_789_923_683,
        temperature: 27.5,
        feelsLike: 27.6,
        humidity: 46,
        degraded: false,
        stale: false,
        ageMinutes: 0
    )
    let original = MeteoSnapshot(observation: observation, forecast: nil, fetchedAt: Date(timeIntervalSince1970: 1_789_923_700))
    let data = try JSONEncoder().encode(original)
    let restored = try JSONDecoder().decode(MeteoSnapshot.self, from: data)

    #expect(restored == original)
}

@Test func legacySnapshotWithoutSeveralDaysStillDecodes() throws {
    let json = """
    {
      "observation": {
        "station": "Observatori Meteorològic Fontanillas",
        "location": "Sant Celoni · Montseny",
        "temperature": 18.6
      },
      "forecast": {
        "date": "2026-09-15",
        "weatherCode": 2,
        "temperatureMax": 24,
        "temperatureMin": 14,
        "precipitationProbability": 20
      },
      "fetchedAt": 1789453800
    }
    """.data(using: .utf8)!

    let restored = try JSONDecoder().decode(MeteoSnapshot.self, from: json)

    #expect(restored.forecasts == nil)
    #expect(restored.forecastDays.count == 1)
    #expect(restored.forecastDays.first?.date == "2026-09-15")
}
