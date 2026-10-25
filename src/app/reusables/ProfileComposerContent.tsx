import { Avatar, Btn, Icon } from "@/reusables/design";
import type { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { useSelector } from "react-redux";
import "@/styles/profile-composer.css";

/** Shared contents of the profile composer card; the caller owns its draft/modal. */
export default function ProfileComposerContent({
  placeholder,
  value,
  onChange,
  onOpen,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onOpen: (withImage: boolean) => void;
}) {
  const authentication = useSelector(
    (state: { authentication: AuthenticationInterface }) => state.authentication,
  );
  const active = authentication.active_entity_context;
  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Avatar
          id={active?.id || authentication.user.entity_id}
          entityId={active?.id || authentication.user.entity_id}
          name={active?.name || authentication.user.username}
          src={active?.profile && active.profile !== "none" ? active.profile : undefined}
          size={42}
        />
        <input
          type="text"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onFocus={() => onOpen(false)}
          onChange={event => onChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") onOpen(false);
          }}
          className="tw-font-Inter"
          style={{
            flex: 1,
            minWidth: 0,
            height: 40,
            border: "none",
            outline: "none",
            background: "var(--input)",
            padding: "0 14px",
            borderRadius: 21,
            color: "var(--text)",
            fontSize: "var(--fs-body)",
          }}
        />
      </div>
      <div className="cl-profile-composer-actions">
        <button type="button" onClick={() => onOpen(true)}>
          <Icon n="image" s={20} c="var(--green)" />
          Photo
        </button>
        <Btn size="sm" style={{ marginLeft: "auto", opacity: value.trim() ? 1 : 0.7 }} onClick={() => onOpen(false)}>
          Post
        </Btn>
      </div>
    </>
  );
}
