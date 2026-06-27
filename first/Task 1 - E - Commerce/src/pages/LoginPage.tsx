import { useState } from "react"
import { useNavigate, Link } from "@/lib/router"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingBag, AlertCircle } from "lucide-react"

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupConfirm, setSignupConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(loginEmail, loginPassword)
    setLoading(false)
    if (error) setError(error.message)
    else navigate("/")
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    if (signupPassword !== signupConfirm) { setError("Passwords do not match."); return }
    if (signupPassword.length < 6) { setError("Password must be at least 6 characters."); return }
    setLoading(true)
    const { error } = await signUp(signupEmail, signupPassword)
    setLoading(false)
    if (error) setError(error.message)
    else setSuccessMessage("Account created! You can now sign in.")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight">ShopHub</span>
          </div>
          <p className="text-muted-foreground text-sm">Your one-stop online store</p>
        </div>

        <Tabs defaultValue="login" onValueChange={() => { setError(null); setSuccessMessage(null) }}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Sign in to your account to continue shopping</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Continue as guest
                  </Link>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>Join ShopHub to start shopping today</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {successMessage && (
                    <Alert>
                      <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" placeholder="At least 6 characters" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input id="signup-confirm" type="password" placeholder="Repeat your password" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
