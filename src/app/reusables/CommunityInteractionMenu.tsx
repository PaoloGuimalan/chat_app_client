import { useRef } from "react";
import { useSelector } from "react-redux";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Avatar, Icon } from "@/reusables/design";
import { getActiveAvatar } from "@/reusables/hooks/reusable";
import { useCommunityInteractionIdentity } from "@/reusables/hooks/communityInteractionIdentity";
import { useScopedPortalRoot } from "@/reusables/hooks/useScopedPortalRoot";
import type { AuthenticationInterface, IPost } from "@/reusables/vars/interfaces";
import { AnonymousAvatar } from "./ContributionAuthor";
import "@/styles/community-interaction.css";

/** One identity preference for this post's reactions, comments and replies. */
export default function CommunityInteractionMenu({
  post,
}: {
  post: Pick<IPost, "post_id" | "community">;
}) {
  const authentication = useSelector(
    (state: { authentication: AuthenticationInterface }) => state.authentication,
  );
  if (!authentication.auth || !post.community ||
      (post.community.is_private && !post.community.is_member)) return null;
  return <MemberInteractionMenu post={post} authentication={authentication} />;
}

function MemberInteractionMenu({ post, authentication }: {
  post: Pick<IPost, "post_id" | "community">;
  authentication: AuthenticationInterface;
}) {
  const actor = authentication.active_entity_context?.id ?? authentication.user.entity_id;
  const [anonymous, setAnonymous] = useCommunityInteractionIdentity(actor, post.post_id);
  const trigger = useRef<HTMLButtonElement>(null);
  const portalRoot = useScopedPortalRoot(trigger);
  const avatar = getActiveAvatar(authentication);
  const fullName = authentication.user.fullName;
  const profileName = authentication.active_entity_context?.is_switched
    ? authentication.active_entity_context.name
    : [fullName?.firstName, fullName?.middleName, fullName?.lastName]
      .filter(part => part && part !== "N/A").join(" ");
  const name = profileName || avatar.name || "My profile";
  const profileAvatar = <Avatar id={actor} name={name} src={avatar.src} size={24} />;

  return (
    <DropdownMenu.Root key={`${actor}:${post.post_id}`} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          ref={trigger}
          type="button"
          className="cl-community-interaction-trigger"
          aria-label={`Interact as ${anonymous ? "Anonymous" : name}`}
          title="Interact as"
          onClick={event => event.stopPropagation()}
        >
          {anonymous ? <AnonymousAvatar size={24} /> : profileAvatar}
          <Icon n="expand_more" s={14} c="var(--text-3)" />
        </button>
      </DropdownMenu.Trigger>
      {portalRoot && (
        <DropdownMenu.Portal container={portalRoot}>
          <DropdownMenu.Content
            className="cl-community-interaction-menu"
            align="end"
            side="top"
            sideOffset={8}
            collisionPadding={12}
            aria-label="Interact as"
            onClick={event => event.stopPropagation()}
          >
            <DropdownMenu.Label className="cl-community-interaction-menu__label">
              Interact as
            </DropdownMenu.Label>
            <DropdownMenu.RadioGroup
              value={anonymous ? "anonymous" : "profile"}
              onValueChange={value => setAnonymous(value === "anonymous")}
            >
              <DropdownMenu.RadioItem value="profile" aria-label={name} className="cl-community-interaction-menu__option">
                {profileAvatar}<span>{name}</span>
                <DropdownMenu.ItemIndicator><Icon n="check" s={16} /></DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value="anonymous" aria-label="Anonymous" className="cl-community-interaction-menu__option">
                <AnonymousAvatar size={24} /><span>Anonymous</span>
                <DropdownMenu.ItemIndicator><Icon n="check" s={16} /></DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      )}
    </DropdownMenu.Root>
  );
}
