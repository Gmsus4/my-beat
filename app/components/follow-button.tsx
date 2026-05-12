import { followUser, unfollowUser } from "@/app/actions/follows";

type FollowButtonProps = {
  username: string;
  isCurrentUser: boolean;
  isFollowing: boolean;
};

export function FollowButton({
  username,
  isCurrentUser,
  isFollowing,
}: FollowButtonProps) {
  if (isCurrentUser) {
    return null;
  }

  return (
    <form action={isFollowing ? unfollowUser : followUser}>
      <input type="hidden" name="username" value={username} />
      <button
        type="submit"
        className={
          isFollowing
            ? "inline-flex h-10 items-center justify-center rounded-md border border-zinc-700 px-4 text-sm font-semibold text-zinc-100 transition hover:border-red-400 hover:text-red-200"
            : "inline-flex h-10 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-semibold text-black transition hover:bg-orange-400"
        }
      >
        {isFollowing ? "Siguiendo" : "Seguir"}
      </button>
    </form>
  );
}
