from flaskpp import Module
from flaskpp.app.socket import default_event, html_injector
from flaskpp.app.data import commit
from flaskpp.app.data.babel import I18nMessage, get_entries, remove_entries, get_entry, add_entry
from flaskpp.utils.debugger import log


def register_events(mod: Module):
    log("info", f"Registering socket events of '{mod.module_name}'...")

    @html_injector("i18n_entries")
    def entries():
        html = ""
        for entry in get_entries(
            I18nMessage.domain != mod.name
        ):
            html += mod.render_template("entry.html", entry=entry)
        return html

    @default_event("i18n_entry_data")
    def entry_data(data):
        response = {
            "success": False
        }

        locales = {}
        for entry in get_entries(key=data.get("key"), domain=data.get("domain")):
            locales[entry.locale] = entry.text

        if not locales:
            return response

        response["success"] = True
        response["locales"] = locales
        return response

    @default_event("i18n_delete_entry")
    def delete(data):
        remove_entries(data.get("key"), data.get("domain"))
        return { "success": True }

    @default_event("i18n_save_entry")
    def save(data):
        key = data.get("key")
        domain = data.get("domain")
        messages = data.get("messages", {})
        for locale in messages:
            entry = get_entry(key, domain, locale)
            message = messages[locale]
            if entry:
                entry.message = message
            else:
                add_entry(locale, key, message, domain, False)
        commit()
        return { "success": True }
