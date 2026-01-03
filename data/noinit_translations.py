from flaskpp import Module
from flaskpp.app.data import commit
from flaskpp.app.data.babel import add_entry, get_entries
from flaskpp.utils.debugger import log


_msg_keys = [
    "MANAGE",
    "NEW_ENTRY",
    "SAVE",
    "EDIT_ENTRY",
    "SELECT_LOCALE",
    "FIELD_REQUIRED",
    "MISSING_MESSAGE",
    "DELETE_ENTRY",
    "SURE_TO_DELETE",

]

_translations_en = {
    _msg_keys[0]: "Manage I18n",
    _msg_keys[1]: "Create new entry",
    _msg_keys[2]: "Save",
    _msg_keys[3]: "Edit entry",
    _msg_keys[4]: "Select locale",
    _msg_keys[5]: "This field must not be empty.",
    _msg_keys[6]: "Missing message for",
    _msg_keys[7]: "You are about to delete this entry",
    _msg_keys[8]: "This action will delete all entries of {key}@{domain}.\n"
                  "Are you sure to continue?",

}

_translations_de = {
    _msg_keys[0]: "I18n verwalten",
    _msg_keys[1]: "Neuen Eintrag erstellen",
    _msg_keys[2]: "Speichern",
    _msg_keys[3]: "Eintrag bearbeiten",
    _msg_keys[4]: "Sprache auswählen",
    _msg_keys[5]: "Dieses Feld darf nicht leer sein.",
    _msg_keys[6]: "Fehlende Eingabe für",
    _msg_keys[7]: "Du bist dabei diesen Eintrag zu löschen",
    _msg_keys[8]: "Diese Aktion löscht alle Einträge für {key}@{domain}.\n"
                  "Möchtest du wirklich fortfahren?",

}


def _add_entries(key, domain):
    add_entry("en", key, _translations_en[key], domain, False)
    add_entry("de", key, _translations_de[key], domain, False)


def setup_db(mod: Module):
    domain = mod.name
    entries = get_entries(domain=domain, locale="en")

    if entries:
        log("info", f"Updating translations of '{mod.module_name}'...")

        keys = [e.key for e in entries]
        for key in _msg_keys:
            if key not in keys:
                _add_entries(key, domain)

        for entry in entries:
            if _translations_en[entry.key] != entry.text:
                entry.text = _translations_en[entry.key]
    else:
        log("info", f"Setting up translations of '{mod.module_name}'...")

        for key in _msg_keys:
            _add_entries(key, domain)

    commit()
