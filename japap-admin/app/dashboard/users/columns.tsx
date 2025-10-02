"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, TrendingUp, Shield, Trash2, Archive, Key } from "lucide-react"

export type UserAccount = {
  id: string
  name: string | null
  phone: string
  email: string | null
  role: 'user' | 'moderator' | 'admin'
  status: 'active' | 'pending' | 'suspended' | 'blocked'
  reputationScore: number
  createdAt: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'suspended': return 'bg-orange-100 text-orange-800'
    case 'blocked': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin': return 'bg-purple-100 text-purple-800'
    case 'moderator': return 'bg-blue-100 text-blue-800'
    case 'user': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Actif'
    case 'pending': return 'En attente'
    case 'suspended': return 'Suspendu'
    case 'blocked': return 'Bloqué'
    default: return status
  }
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin': return 'Administrateur'
    case 'moderator': return 'Modérateur'
    case 'user': return 'Utilisateur'
    default: return role
  }
}

interface ColumnsProps {
  onViewUser: (user: UserAccount) => void
  onEditUser: (user: UserAccount) => void
  onChangeStatus: (user: UserAccount) => void
  onChangeRole: (user: UserAccount) => void
  onManagePassword: (user: UserAccount) => void
  onArchiveUser: (user: UserAccount) => void
  onDeleteUser: (user: UserAccount) => void
  selectedUsers: string[]
  onSelectUser: (userId: string) => void
}

export const createColumns = ({
  onViewUser,
  onEditUser,
  onChangeStatus,
  onChangeRole,
  onManagePassword,
  onArchiveUser,
  onDeleteUser,
  selectedUsers,
  onSelectUser,
}: ColumnsProps): ColumnDef<UserAccount>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Tout sélectionner"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={selectedUsers.includes(row.original.id)}
        onCheckedChange={() => onSelectUser(row.original.id)}
        aria-label="Sélectionner la ligne"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Nom",
    cell: ({ row }) => {
      const user = row.original
      const name = user.name
      const phone = user.phone
      return (
        <div className="flex flex-col">
          <span
            className="font-medium hover:text-red-600 cursor-pointer transition-colors"
            onClick={() => onViewUser(user)}
          >
            {name || "Sans nom"}
          </span>
          <span className="text-xs text-gray-500">{phone}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string | null
      return email ? (
        <span className="text-sm">{email}</span>
      ) : (
        <span className="text-xs text-gray-400 italic">Non renseigné</span>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Rôle",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge className={getRoleColor(role)}>
          {getRoleLabel(role)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge className={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "reputationScore",
    header: "Score",
    cell: ({ row }) => {
      const score = row.getValue("reputationScore") as number
      return (
        <div className="flex items-center space-x-1">
          <span className="text-sm font-semibold text-yellow-600">{score}</span>
          <span className="text-xs text-gray-500">pts</span>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEditUser(user)}>
              <Edit className="h-4 w-4 mr-2" />
              Éditer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeStatus(user)}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Changer le statut
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeRole(user)}>
              <Shield className="h-4 w-4 mr-2" />
              Changer le rôle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onManagePassword(user)}>
              <Key className="h-4 w-4 mr-2" />
              Gérer mot de passe
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onArchiveUser(user)}>
              <Archive className="h-4 w-4 mr-2" />
              Archiver
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteUser(user)} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
