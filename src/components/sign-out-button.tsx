
"use client"

import { signOut } from "@/app/auth/sign-out-action"
import { Button } from "./ui/button"

export function SignOutButton() {
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // best-effort clear client storage before server action runs
    try {
      const { clearClientData } = await import('@/lib/client/clearClientData')
      await clearClientData()
    } catch (err) {
      // ignore
    }
    // allow the form to submit to the server action
  }

  return (
    <form action={signOut} onSubmit={onSubmit}>
      <Button type="submit" variant="ghost">تسجيل الخروج</Button>
    </form>
  )
}
