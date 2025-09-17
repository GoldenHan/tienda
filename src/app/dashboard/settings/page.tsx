"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
});

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !user.email) {
      toast({ variant: "destructive", title: "Error", description: "No user is signed in." });
      return;
    }

    setIsLoading(true);

    try {
      // Re-authenticate the user first
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // If re-authentication is successful, update the password
      await updatePassword(user, values.newPassword);
      
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      form.reset();
    } catch (error: any) {
      console.error("Password update error:", error);
      toast({
        variant: "destructive",
        title: "Error Updating Password",
        description: error.code === 'auth/wrong-password' 
          ? "The current password you entered is incorrect."
          : "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account settings.</p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Admin Account</CardTitle>
            <CardDescription>Update your administrator credentials.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" readOnly defaultValue={user?.email || ""} />
                </div>
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Update Password"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
