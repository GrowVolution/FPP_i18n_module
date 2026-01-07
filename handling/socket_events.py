from flaskpp import Module
from flaskpp.app.extensions import socket
from flaskpp.app.data import commit
from flaskpp.app.data.babel import I18nMessage, get_entries, remove_entries, get_entry, add_entry
from flaskpp.utils.debugger import log


def register_events(mod: Module):
    log("info", f"Registering socket events of '{mod.module_name}'...")

    namespace = mod.name
    mod.context["namespace"] = namespace

    @socket.html_injector("entries", namespace=namespace)
    def entries():
        html = ""
        for entry in get_entries(
            I18nMessage.domain != namespace
        ):
            html += mod.render_template("entry.html", entry=entry)
        return html

    @socket.on_default("entry_data", namespace=namespace)
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

    @socket.on_default("delete_entry", namespace=namespace)
    def delete(data):
        remove_entries(data.get("key"), data.get("domain"))
        return { "success": True }

    @socket.on_default("save_entry", namespace=namespace)
    def save(data):
        key = data.get("key")
        domain = data.get("domain")
        messages = data.get("messages", {})
        for locale in messages:
            entry = get_entry(key, locale, domain)
            message = messages[locale]
            if entry:
                entry.text = message
            else:
                add_entry(locale, key, message, domain, False)
        commit()
        return { "success": True }
