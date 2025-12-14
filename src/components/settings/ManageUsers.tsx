import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, User, Mail, Save, X } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'Admin' | 'Membro';
  email: string;
}

const fetchUsersWithProfiles = async (): Promise<Profile[]> => {
  // Fetch profiles first
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role');

  if (profilesError) throw profilesError;

  // Fetch user emails from auth.users (requires service role, but we rely on RLS for profiles)
  // Since we cannot directly query auth.users from client, we rely on the profiles table and assume email is available if needed, 
  // but for simplicity and security constraints, we will only display data available via RLS on 'profiles'.
  // NOTE: Supabase client-side RLS prevents direct access to auth.users emails. 
  // We will simulate email retrieval by assuming a placeholder or relying on the user context if available, 
  // but for this implementation, we will focus on profile data and role management.
  
  // To get emails, we would need an Edge Function or Service Role key, which is not available client-side.
  // We will use a placeholder for email for now.
  
  return profilesData.map(p => ({
    ...p,
    email: `ID: ${p.id.substring(0, 8)}...`, // Placeholder for email
  })) as Profile[];
};

const ManageUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<'Admin' | 'Membro'>('Membro');

  const { data: users, isLoading, error } = useQuery<Profile[], Error>({
    queryKey: ['usersWithProfiles'],
    queryFn: fetchUsersWithProfiles,
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      // NOTE: Client-side signup is usually disabled for Admin-only creation.
      // Since we cannot use the Admin API (service role key) client-side, 
      // we rely on the standard signup function, but the user must be created by the Admin.
      // We assume the Admin is using this interface to create accounts.
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            first_name: 'Novo',
            last_name: 'Usuário',
          }
        }
      });

      if (error) throw error;
      
      // If successful, the handle_new_user trigger sets the default role 'Membro'.
      // We don't need to manually update the role here unless we want to set them as Admin immediately.
    },
    onSuccess: () => {
      showSuccess('Usuário criado com sucesso! Ele pode fazer login agora.');
      setNewEmail('');
      setNewPassword('');
      queryClient.invalidateQueries({ queryKey: ['usersWithProfiles'] });
    },
    onError: (error) => {
      showError('Erro ao criar usuário: ' + error.message);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'Admin' | 'Membro' }) => {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Função do usuário atualizada.');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['usersWithProfiles'] });
    },
    onError: (error) => {
      showError('Erro ao atualizar função: ' + error.message);
    },
  });

  const handleEditRole = (user: Profile) => {
    setEditingId(user.id);
    setEditingRole(user.role);
  };

  const handleSaveRole = (id: string) => {
    updateRoleMutation.mutate({ id, role: editingRole });
  };

  if (isLoading) {
    return <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-red-500">Erro ao carregar usuários: {error.message}</div>;
  }

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center"><User className="w-5 h-5 mr-2" /> Gerenciar Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        
        {/* Formulário de Criação de Usuário */}
        <div className="mb-8 p-4 border rounded-lg bg-accent/50">
          <h3 className="text-lg font-semibold mb-3">Criar Novo Usuário</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <Input
              placeholder="Senha (mínimo 6 caracteres)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button 
              onClick={() => createUserMutation.mutate()} 
              disabled={!newEmail || newPassword.length < 6 || createUserMutation.isPending}
            >
              {createUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Criar Usuário
            </Button>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email/ID</TableHead>
                <TableHead className="w-[200px]">Função</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name || 'N/A'} {user.last_name || ''}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {editingId === user.id ? (
                      <Select value={editingRole} onValueChange={(val) => setEditingRole(val as 'Admin' | 'Membro')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Membro">Membro</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingId === user.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleSaveRole(user.id)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <Save className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditRole(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManageUsers;