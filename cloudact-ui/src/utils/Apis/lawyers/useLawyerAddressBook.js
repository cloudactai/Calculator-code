// One shared copy of the user's lawyer address book for a form. Both the
// lawyer-name pickers (client + opposing party) and the "Lawyer details" modal
// read from the same instance, so a lawyer added in the modal is immediately
// selectable in the dropdowns.
import { useCallback, useEffect, useRef, useState } from "react";

import {
  createLawyer,
  deleteLawyer,
  listLawyers,
  updateLawyer,
} from "./lawyerAddressBookApi";

const useLawyerAddressBook = () => {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listLawyers();
      if (!mountedRef.current) return;
      setLawyers(rows);
      setError("");
    } catch (err) {
      if (mountedRef.current) {
        setError("Could not load the lawyer address book. Please try again.");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Create or update depending on whether the draft carries an id; returns the
  // saved row so callers can select it.
  const save = useCallback(
    async (draft) => {
      const saved = draft?.id
        ? await updateLawyer(draft.id, draft)
        : await createLawyer(draft);
      await reload();
      return saved;
    },
    [reload]
  );

  const remove = useCallback(
    async (id) => {
      await deleteLawyer(id);
      await reload();
    },
    [reload]
  );

  return { lawyers, loading, error, reload, save, remove };
};

export default useLawyerAddressBook;
