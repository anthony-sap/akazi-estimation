"use client";

import { User } from "@prisma/client";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface UserModalProps {
  user: User;
}

export default function UserModal({ user }: UserModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full">
          <div className="flex w-full items-center gap-2">
            <Eye className="size-4" />
            Detail
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="mb-4">User details</DialogTitle>
          <DialogDescription></DialogDescription>
          <div className="mb-4 grid gap-4">
            <div className="flex gap-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={user.firstName ?? ""}
                  readOnly={true}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  defaultValue={user.lastName ?? ""}
                  readOnly={true}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                defaultValue={user.email ?? ""}
                readOnly={true}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="roles">Roles</Label>
              <Input
                id="roles"
                name="roles"
                defaultValue={user.roles.join(", ")}
                readOnly={true}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                name="status"
                defaultValue={user.status}
                readOnly={true}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
