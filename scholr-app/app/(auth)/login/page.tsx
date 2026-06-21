import type { Metadata } from "next"
import LoginForm from "./LoginForm"
export const metadata: Metadata = { title: "Sign in" }
export default function LoginPage({ searchParams }: { searchParams: { redirect?: string; error?: string } }) {
  return <LoginForm redirectTo={searchParams.redirect} serverError={searchParams.error} />
}
