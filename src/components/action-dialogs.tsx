"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState, type ReactNode } from "react";

type HiddenInput = {
  name: string;
  value: string | number | boolean;
};

type DialogAction = (formData: FormData) => void | Promise<void>;

function HiddenFields({ fields = [] }: { fields?: HiddenInput[] }) {
  return (
    <>
      {fields.map((field) => (
        <input key={field.name} name={field.name} type="hidden" value={String(field.value)} />
      ))}
    </>
  );
}

export function ActionDialog({
  action,
  buttonLabel,
  buttonIcon,
  buttonVariant = "primary",
  children,
  description,
  formClassName = "dialog-form",
  hiddenFields,
  submitLabel = "Speichern",
  title,
}: {
  action: DialogAction;
  buttonLabel: string;
  buttonIcon?: ReactNode;
  buttonVariant?: "primary" | "secondary";
  children: ReactNode;
  description?: string;
  formClassName?: string;
  hiddenFields?: HiddenInput[];
  submitLabel?: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  function requestClose() {
    if (dirty) {
      setConfirmClose(true);
      return;
    }
    setOpen(false);
  }

  function discard() {
    setConfirmClose(false);
    setDirty(false);
    setOpen(false);
  }

  return (
    <>
      <motion.button
        className={`button ${buttonVariant === "secondary" ? "secondary" : ""}`}
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        {buttonIcon}
        {buttonLabel}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="modal-panel action-dialog-panel"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="modal-header">
                <div>
                  <h2>{title}</h2>
                  {description ? <p>{description}</p> : null}
                </div>
                <button className="modal-close" type="button" onClick={requestClose} aria-label="Fenster schließen">
                  <X size={18} />
                </button>
              </div>
              <form
                action={action}
                className={formClassName}
                onChangeCapture={() => setDirty(true)}
                onSubmit={() => {
                  setDirty(false);
                  setOpen(false);
                }}
              >
                <HiddenFields fields={hiddenFields} />
                {children}
                <div className="action-dialog-footer">
                  <button className="button secondary" type="button" onClick={requestClose}>
                    Abbrechen
                  </button>
                  <button className="button" type="submit">
                    {submitLabel}
                  </button>
                </div>
              </form>
            </motion.div>
            <AnimatePresence>
              {confirmClose ? (
                <motion.div className="confirm-dialog" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                  <h3>Änderungen verwerfen?</h3>
                  <p>Nicht gespeicherte Änderungen gehen verloren.</p>
                  <div>
                    <button className="button secondary" type="button" onClick={() => setConfirmClose(false)}>
                      Abbrechen
                    </button>
                    <button className="button" type="button" onClick={discard}>
                      Verwerfen
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function ConfirmActionDialog({
  action,
  buttonIcon,
  buttonLabel,
  buttonVariant = "secondary",
  confirmLabel = "Bestätigen",
  description,
  hiddenFields,
  title,
}: {
  action: DialogAction;
  buttonIcon?: ReactNode;
  buttonLabel: string;
  buttonVariant?: "primary" | "secondary";
  confirmLabel?: string;
  description: string;
  hiddenFields?: HiddenInput[];
  title: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        className={`button ${buttonVariant === "secondary" ? "secondary" : ""}`}
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        {buttonIcon}
        {buttonLabel}
      </motion.button>
      <AnimatePresence>
        {open ? (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="modal-panel confirm-panel"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="modal-header">
                <div>
                  <h2>{title}</h2>
                  <p>{description}</p>
                </div>
                <button className="modal-close" type="button" onClick={() => setOpen(false)} aria-label="Fenster schließen">
                  <X size={18} />
                </button>
              </div>
              <form action={action} onSubmit={() => setOpen(false)}>
                <HiddenFields fields={hiddenFields} />
                <div className="action-dialog-footer">
                  <button className="button secondary" type="button" onClick={() => setOpen(false)}>
                    Abbrechen
                  </button>
                  <button className="button" type="submit">
                    {confirmLabel}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
