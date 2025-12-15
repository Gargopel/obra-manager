import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, User, Mail, Save, X, Edit } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; // Importando Badge

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'Admin' | 'Membro';
  email: string;
  position?: string | null; // Adicionando position
}

const fetchUsersWithProfiles = async (): Promise<Profile[]> => {
  // Fetch profiles first
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, position'); // Incluindo position
  
  if (profilesError) throw profilesError;

  // Para simplificar, vamos usar um placeholder para o email
  // Em um cenário real, você pode querer buscar os emails via uma função edge ou serviço
  return profilesData.map(p => ({
    ...p,
    email: `ID: ${p.id.substring(0, 8)}...`, // Placeholder para email
  })) as Profile[];
};

const ManageUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<'Admin' | 'Membro'>('Membro');
  const [editingFirstName, setEditingFirstName] = useState('');
  const [editingLastName, setEditingLastName] = useState('');
  const [editingPosition, setEditingPosition] = useState('');

  const { data: users, isLoading, error } = useQuery<Profile[], Error>({
    queryKey: ['usersWithProfiles'],
    queryFn: fetchUsersWithProfiles,
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
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

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, first_name, last_name, position, role }: { 
      id: string; 
      first_name: string; 
      last_name: string; 
      position: string;
      role: 'Admin' | 'Membro';
    }) => {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ first_name, last_name, position, role })
        .eq('id', id);
      
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      showSuccess('Perfil do usuário atualizado.');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['usersWithProfiles'] });
    },
    onError: (error) => {
      showError('Erro ao atualizar perfil: ' + error.message);
    },
  });

  const handleEditProfile = (user: Profile) => {
    setEditingId(user.id);
    setEditingFirstName(user.first_name || '');
    setEditingLastName(user.last_name || '');
    setEditingPosition(user.position || '');
    setEditingRole(user.role);
  };

  const handleSaveProfile = (id: string) => {
    updateProfileMutation.mutate({
      id,
      first_name: editingFirstName.trim(),
      last_name: editingLastName.trim(),
      position: editingPosition.trim(),
      role: editingRole
    });
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
                <TableHead>Cargo</TableHead>
                <TableHead className="w-[200px]">Função</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {editingId === user.id ? (
                      <div className="space-y-2">
                        <Input 
                          value={editingFirstName} 
                          onChange={(e) => setEditingFirstName(e.target.value)} 
                          placeholder="Primeiro nome"
                        />
                        <Input 
                          value={editingLastName} 
                          onChange={(e) => setEditingLastName(e.target.value)} 
                          placeholder="Último nome"
                        />
                      </div>
                    ) : (
                      `${user.first_name || 'N/A'} ${user.last_name || ''}`
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {editingId === user.id ? (
                      <Input 
                        value={editingPosition} 
                        onChange={(e) => setEditingPosition(e.target.value)} 
                        placeholder="Cargo"
                      />
                    ) : (
                      user.position || 'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === user.id ? (
                      <Select 
                        value={editingRole} 
                        onValueChange={(val) => setEditingRole(val as 'Admin' | 'Membro')}
                      >
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
                          onClick={() => handleSaveProfile(user.id)} 
                          disabled={updateProfileMutation.isPending}
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
                        onClick={() => handleEditProfile(user)}
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