'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Mic, 
  Shield, 
  Database, 
  Users, 
  Bell,
  Palette,
  Globe,
  Lock
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const settingsCategories = [
    {
      title: 'Documentação por Voz',
      description: 'Configure processamento de voz e reconhecimento médico',
      icon: Mic,
      href: '/configuracoes/voice',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Segurança e Privacidade',
      description: 'Configurações de segurança, criptografia e conformidade',
      icon: Shield,
      href: '/configuracoes/security',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Banco de Dados',
      description: 'Configurações de backup, migração e manutenção',
      icon: Database,
      href: '/configuracoes/database',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Usuários e Permissões',
      description: 'Gerenciar usuários, roles e permissões do sistema',
      icon: Users,
      href: '/configuracoes/users',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Notificações',
      description: 'Configurar alertas, lembretes e comunicações',
      icon: Bell,
      href: '/configuracoes/notifications',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Aparência',
      description: 'Personalizar tema, cores e interface do usuário',
      icon: Palette,
      href: '/configuracoes/appearance',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'Idioma e Região',
      description: 'Configurar idioma, fuso horário e localização',
      icon: Globe,
      href: '/configuracoes/locale',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    },
    {
      title: 'Licenças',
      description: 'Gerenciar licenças, ativações e módulos',
      icon: Lock,
      href: '/configuracoes/licenses',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema e personalize sua experiência
        </p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Link key={category.href} href={category.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <Database className="h-4 w-4 mr-2" />
              Backup do Sistema
            </Button>
            <Button variant="outline" className="justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Verificar Segurança
            </Button>
            <Button variant="outline" className="justify-start">
              <Bell className="h-4 w-4 mr-2" />
              Testar Notificações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">2.3s</div>
              <div className="text-sm text-muted-foreground">Tempo de Resposta</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">1.2GB</div>
              <div className="text-sm text-muted-foreground">Uso de Memória</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">45%</div>
              <div className="text-sm text-muted-foreground">Uso de CPU</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
