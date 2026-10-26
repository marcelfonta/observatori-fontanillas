import Toybox.Application;
import Toybox.Application.Storage;
import Toybox.Communications;
import Toybox.Graphics;
import Toybox.Lang;
import Toybox.Time;
import Toybox.WatchUi;

class FontanillasApp extends Application.AppBase {
    var _client;

    function initialize() {
        AppBase.initialize();
        _client = new StationClient();
    }

    function getInitialView() {
        return [new StationView(_client)];
    }

    function getGlanceView() {
        return [new StationGlance(_client)];
    }
}

class StationClient {
    const URL = "https://fonta-meteo.marcelfonta.workers.dev/widget-observation";
    const CACHE_KEY = "station-observation-v1";
    const ATTEMPT_KEY = "station-last-attempt-v1";
    const MIN_REQUEST_GAP = 300;
    var _requesting = false;

    function reading() {
        var result = Storage.getValue(CACHE_KEY);
        return result instanceof Dictionary ? result : null;
    }

    function refresh() {
        if (_requesting) { return; }
        var now = Time.now().value();
        var lastAttempt = Storage.getValue(ATTEMPT_KEY);
        if (lastAttempt != null && now - lastAttempt < MIN_REQUEST_GAP) {
            return;
        }
        Storage.setValue(ATTEMPT_KEY, now);
        _requesting = true;
        try {
            Communications.makeWebRequest(
                URL,
                null,
                {
                    :method => Communications.HTTP_REQUEST_METHOD_GET,
                    :headers => { "Accept" => "application/json" },
                    :responseType => Communications.HTTP_RESPONSE_CONTENT_TYPE_JSON
                },
                method(:onResponse)
            );
        } catch (error) {
            _requesting = false;
        }
    }

    function onResponse(code as Number, data as Null or ByteArray or Dictionary or String or Toybox.PersistedContent.Iterator) as Void {
        _requesting = false;
        if (code == 200 && data instanceof Dictionary) {
            var epoch = data["epoch"];
            var temperature = numeric(data["temperature"]);
            var now = Time.now().value();
            if ((epoch instanceof Number || epoch instanceof Long) && temperature != null && temperature >= -50 && temperature <= 60 && epoch <= now + 60 && now - epoch < 86400) {
                var saved = {
                    "epoch" => epoch.toNumber(),
                    "fetchedAt" => now,
                    "temperature" => temperature,
                    "degraded" => data["degraded"] == true || data["stale"] == true
                };
                var humidity = numeric(data["humidity"]);
                var wind = numeric(data["windSpeed"]);
                var rain = numeric(data["rainToday"]);
                if (humidity != null && humidity >= 0 && humidity <= 100) { saved["humidity"] = humidity; }
                if (wind != null && wind >= 0 && wind <= 250) { saved["windSpeed"] = wind; }
                if (rain != null && rain >= 0 && rain <= 1000) { saved["rainToday"] = rain; }
                Storage.setValue(CACHE_KEY, saved);
            }
        }
        WatchUi.requestUpdate();
    }

    function numeric(value) {
        if (value instanceof Number || value instanceof Long || value instanceof Float || value instanceof Double) {
            return value.toFloat();
        }
        return null;
    }

    function ageMinutes(reading) {
        if (reading == null || reading["epoch"] == null) { return null; }
        var elapsed = Time.now().value() - reading["epoch"];
        return elapsed < 0 ? null : (elapsed / 60).toNumber();
    }

    function usable(reading) {
        var age = ageMinutes(reading);
        return age != null && age <= 90 && reading["temperature"] != null;
    }

    function status(reading) {
        if (!usable(reading)) { return "Sense dades recents"; }
        var age = ageMinutes(reading);
        if (age >= 30 || reading["degraded"] == true) { return "Darrera lectura · fa " + age + " min"; }
        return "Observat · fa " + age + " min";
    }

    function decimal(value, unit) {
        return value == null ? "—" : value.toFloat().format("%.1f") + unit;
    }

    function whole(value, unit) {
        return value == null ? "—" : value.toNumber().toString() + unit;
    }
}

class StationGlance extends WatchUi.GlanceView {
    var _client;

    function initialize(client) {
        GlanceView.initialize();
        _client = client;
    }

    function onShow() {
        _client.refresh();
    }

    function onUpdate(dc) {
        var reading = _client.reading();
        var height = dc.getHeight();
        dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
        dc.clear();
        dc.setColor(0x70D6A1, Graphics.COLOR_BLACK);
        dc.drawText(8, 4, Graphics.FONT_XTINY, "FONTA", Graphics.TEXT_JUSTIFY_LEFT);
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK);
        dc.drawText(dc.getWidth() - 30, 4, Graphics.FONT_SMALL,
            _client.usable(reading) ? _client.decimal(reading["temperature"], "°C") : "—",
            Graphics.TEXT_JUSTIFY_RIGHT);
        dc.setColor(0xA0A0A0, Graphics.COLOR_BLACK);
        dc.drawText(8, height - 23, Graphics.FONT_XTINY, _client.status(reading), Graphics.TEXT_JUSTIFY_LEFT);
    }
}

class StationView extends WatchUi.View {
    var _client;

    function initialize(client) {
        View.initialize();
        _client = client;
    }

    function onShow() {
        _client.refresh();
    }

    function onUpdate(dc) {
        var reading = _client.reading();
        var width = dc.getWidth();
        dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
        dc.clear();
        dc.setColor(0x70D6A1, Graphics.COLOR_BLACK);
        dc.drawText(width / 2, 28, Graphics.FONT_XTINY, "FONTANILLAS", Graphics.TEXT_JUSTIFY_CENTER);
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK);
        dc.drawText(width / 2, 60, Graphics.FONT_LARGE,
            _client.usable(reading) ? _client.decimal(reading["temperature"], "°C") : "—",
            Graphics.TEXT_JUSTIFY_CENTER);
        dc.setColor(0xA0A0A0, Graphics.COLOR_BLACK);
        dc.drawText(width / 2, 105, Graphics.FONT_XTINY, _client.status(reading), Graphics.TEXT_JUSTIFY_CENTER);
        dc.setColor(0x70D6A1, Graphics.COLOR_BLACK);
        dc.drawLine(45, 135, width - 45, 135);
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK);
        if (_client.usable(reading)) {
            dc.drawText(55, 150, Graphics.FONT_XTINY, "Humitat", Graphics.TEXT_JUSTIFY_LEFT);
            dc.drawText(width - 55, 150, Graphics.FONT_XTINY, _client.whole(reading["humidity"], "%"), Graphics.TEXT_JUSTIFY_RIGHT);
            dc.drawText(55, 175, Graphics.FONT_XTINY, "Vent", Graphics.TEXT_JUSTIFY_LEFT);
            dc.drawText(width - 55, 175, Graphics.FONT_XTINY, _client.decimal(reading["windSpeed"], " km/h"), Graphics.TEXT_JUSTIFY_RIGHT);
            dc.drawText(55, 200, Graphics.FONT_XTINY, "Pluja avui", Graphics.TEXT_JUSTIFY_LEFT);
            dc.drawText(width - 55, 200, Graphics.FONT_XTINY, _client.decimal(reading["rainToday"], " mm"), Graphics.TEXT_JUSTIFY_RIGHT);
        }
        dc.setColor(0xA0A0A0, Graphics.COLOR_BLACK);
        dc.drawText(width / 2, 235, Graphics.FONT_XTINY, "Sant Celoni", Graphics.TEXT_JUSTIFY_CENTER);
    }
}
