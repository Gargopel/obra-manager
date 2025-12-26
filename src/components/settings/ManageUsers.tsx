import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, User, Mail, Save, X, Edit, Ruler } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'Admin' | 'Membro';
  email: string;
  position?: string | null;
  can_measure: boolean;
}

const fetchUsersWithProfiles = async (): Promise<Profile[]> => {
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, position, can_measure');
  
  if (profilesError) throw profilesError;

  return profilesData.map(p => ({
    ...p,
    email: `ID: ${p.id.substring(0, 8)}...`,
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
  const [editingCanMeasure, setEditingCanMeasure] = useState(false);

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
      showSuccess('Usuário criado com sucesso!');
      setNewEmail('');
      setNewPassword('');
      queryClient.invalidateQueries({ queryKey: ['usersWithProfiles'] });
    },
    onError: (error) => showError('Erro ao criar usuário: ' + error.message),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, first_name, last_name, position, role, can_measure }: { 
      id: string; 
      first_name: string; 
      last_name: string; 
      position: string;
      role: 'Admin' | 'Membro';
      can_measure: boolean;
    }) => {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ first_name, last_name, position, role, can_measure })
        .eq('id', id);
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      showSuccess('Perfil do usuário atualizado.');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['usersWithProfiles'] });
    },
    onError: (error) => showError('Erro ao atualizar perfil: ' + error.message),
  });

  const handleEditProfile = (user: Profile) => {
    setEditingId(user.id);
    setEditingFirstName(user.first_name || '');
    setEditingLastName(user.last_name || '');
    setEditingPosition(user.position || '');
    setEditingRole(user.role);
    setEditingCanMeasure(user.can_measure);
  };

  const handleSaveProfile = (id: string) => {
    updateProfileMutation.mutate({
      id,
      first_name: editingFirstName.trim(),
      last_name: editingLastName.trim(),
      position: editingPosition.trim(),
      role: editingRole,
      can_measure: editingCanMeasure
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

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email/ID</TableHead>
                <TableHead>Medição</TableHead>
                <TableHead className="w-[150px]">Função</TableHead>
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
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`measure-${user.id}`} 
                          checked={editingCanMeasure} 
                          onCheckedChange={(val) => setEditingCanMeasure(!!val)}
                        />
                        <Label htmlFor={`measure-${user.id}`} className="text-xs">Privilégio</Label>
                      </div>
                    ) : (
                      user.can_measure ? <Badge variant="outline" className="text-blue-500 border-blue-200"><Ruler className="w-3 h-3 mr-1" /> Sim</Badge> : <span className="text-xs text-muted-foreground">Não</span>
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
                        <Button variant="ghost" size="icon" onClick={() => handleSaveProfile(user.id)} disabled={updateProfileMutation.isPending}>
                          <Save className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => handleEditProfile(user)}>
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