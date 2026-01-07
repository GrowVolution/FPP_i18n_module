
import "./src/tailwind.css";

const fpp = window.FPP;
if (!fpp) throw new Error("Flask++ base utility missing.");

const _ = fpp._;

const main = document.querySelector('#main') ?? document.querySelector('main');
if (!main) throw new Error("Missing main block for content injection.");


const entryModal = document.querySelector('#entryModal');
if (!entryModal) throw new Error("Missing entry modal.");

const modalTitle = entryModal.querySelector(".headline");
if (!modalTitle) throw new Error("Missing headline object (with .headline class) of entry modal.");

const modalForm = entryModal.querySelector("#entryModalForm");
if (!modalForm) throw new Error("Missing entryModalForm input of entry modal.");

const modalKeyInput = entryModal.querySelector("#entryModalKey");
if (!modalKeyInput) throw new Error("Missing entryModalKey input of entry modal.");

const modalDomainInput = entryModal.querySelector("#entryModalDomain");
if (!modalDomainInput) throw new Error("Missing entryModalDomain input of entry modal.");

const modalLocaleSelect = entryModal.querySelector("#entryModalLocale");
if (!modalLocaleSelect) throw new Error("Missing entryModalLocale select of entry modal.");

const modalMessageInput = entryModal.querySelector("#entryModalMessage");
if (!modalMessageInput) throw new Error("Missing entryModalMessage input of entry modal.");

const modalSaveButton = entryModal.querySelector("#entryModalSave");
if (!modalSaveButton) throw new Error("Missing entryModalSave button of entry modal.");


(async () => {
main.innerHTML = `
  <div class="wrap-center table-container">
    <table>
      <thead>
        <tr>
          <th>Key</th>
          <th>Locale</th>
          <th>Message</th>
          <th>Domain</th>
          <th>Options</th>
        </tr>
      </thead>
    
      <tbody id="entryTableBody"></tbody>
    </table>
    
    <div class="mt-3 w-full lg:max-w-[90vw]">
      <button id="addEntryButton" type="button" class="btn btn-add font-semibold">
        ${await _("NEW_ENTRY")}
      </button>
    </div>
  </div>
`
})().then(async () => {
    const tbody = document.querySelector('#entryTableBody');
    const addButton = document.querySelector('#addEntryButton');


    async function entryData(key, domain) {
        return await fpp.emitAsync("entry_data", {
            key: key,
            domain: domain
        });
    }


    function initTable() {
        tbody.querySelectorAll("tr").forEach(tr => {
            const splitted = tr.id.split("---");
            if (splitted.length !== 2) {
                console.error(`Invalid row id for <tr id="${tr.id}>... Skipping.`);
                return;
            }
            const key = splitted[0];
            const domain = splitted[1];

            const editButton = tr.querySelector(".btn-edit");
            if (!editButton) {
                console.error(`Missing edit button for <tr id="${tr.id}>... Skipping.`);
                return;
            }

            const deleteButton = tr.querySelector(".btn-delete");
            if (!deleteButton) {
                console.error(`Missing delete button for <tr id="${tr.id}>... Skipping.`);
                return;
            }

            editButton.addEventListener("click", async () => {
                const data = await entryData(key, domain);
                if (!data || !data.success) {
                    console.error(`Could not fetch data for <tr id="${tr.id}>... Returning.`);
                    return;
                }

                modalTitle.textContent = await _("EDIT_ENTRY");

                modalKeyInput.value = key;
                modalKeyInput.disabled = true;

                modalDomainInput.value = domain;
                modalDomainInput.disabled = true;

                modalLocaleSelect.value = "";
                modalLocaleSelect.dispatchEvent(new Event('change'));

                localStorage.clear();
                for (const [locale, message] of Object.entries(data.locales))
                    localStorage.setItem(locale, message);

                modalLocaleSelect.value = "";
                modalLocaleSelect.dispatchEvent(new Event('change'));

                fpp.showModal(entryModal);
            });

            deleteButton.addEventListener("click", async () => {
                const confirmed = await fpp.confirmDialog(
                    await _("DELETE_ENTRY"),
                    (await _("SURE_TO_DELETE")).replace("{key}", key).replace("{domain}", domain),
                    null,
                    "danger"
                );
                if (!confirmed) return;

                const r = await fpp.emitAsync("delete_entry", {
                    key: key,
                    domain: domain
                });

                if (!r.success) {
                    console.error(`Failed to delete entry for <tr id="${tr.id}>... Returning.`);
                    return;
                }

                await updateTable();
            });
        });


        addButton.addEventListener("click", async () => {
            modalTitle.textContent = await _("NEW_ENTRY");

            modalKeyInput.value = "";
            modalKeyInput.disabled = false;

            modalDomainInput.value = "messages";
            modalDomainInput.disabled = false;

            modalLocaleSelect.value = "";
            modalLocaleSelect.dispatchEvent(new Event('change'));

            localStorage.clear();

            fpp.showModal(entryModal);
        });
    }

    async function updateTable() {
        await fpp.socketHtmlInject("entries", tbody);
        initTable();
    }


    modalLocaleSelect.addEventListener("change", () => {
        const prev = modalLocaleSelect.dataset.prev;
        if (prev) {
            localStorage.setItem(prev, modalMessageInput.value);
        }

        const current = modalLocaleSelect.value;
        modalLocaleSelect.dataset.prev = current;

        if (!current) {
            modalMessageInput.parentElement.classList.add("hidden");
            modalMessageInput.value = "";
            return;
        }

        modalMessageInput.parentElement.classList.remove("hidden");
        modalMessageInput.value = localStorage.getItem(current) ?? "";
    });


    modalSaveButton.addEventListener("click", async () => {
        if (!modalForm.checkValidity()) {
            modalForm.reportValidity();
            return;
        }

        const messages = {};
        for (const option of modalLocaleSelect.options) {
            if (!option.value) continue;

            modalMessageInput.setCustomValidity("");

            if (
                modalLocaleSelect.value &&
                !modalMessageInput.value
            ) {
                modalMessageInput.setCustomValidity(await _("FIELD_REQUIRED"));
                modalMessageInput.reportValidity();
                return;
            }

            const item = localStorage.getItem(option.value);
            if (!item && modalLocaleSelect.value !== option.value) {
                fpp.flash(
                    `${await _("MISSING_MESSAGE")}: '${option.value}'`,
                    "danger"
                );
                return;
            }
            else if (
                !item || modalLocaleSelect.value === option.value
            ) messages[option.value] = modalMessageInput.value;
            else messages[option.value] = item;
        }

        const r = await fpp.emitAsync("save_entry", {
            key: modalKeyInput.value,
            domain: modalDomainInput.value,
            messages
        });

        fpp.hideModal(entryModal);

        if (!r.success) {
            console.error(`Failed to save entry ${modalKeyInput.value}@${modalDomainInput.value}.`);
            return;
        }

        await updateTable();
    });

    await updateTable();
});
