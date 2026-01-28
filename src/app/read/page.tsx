import { redirect } from "next/navigation";

export default function ReadPage() {
    // Default to John 1 if no last read state is available (server-side we don't know preferences yet)
    // Client-side redirect could handle "Resume" better, but for now this is a safe default.
    redirect("/read/Genesis/1");
}
