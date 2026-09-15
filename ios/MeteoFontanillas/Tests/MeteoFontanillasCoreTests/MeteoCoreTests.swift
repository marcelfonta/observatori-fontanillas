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
