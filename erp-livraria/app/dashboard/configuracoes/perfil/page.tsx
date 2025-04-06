"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { ArrowLeft, Check, User, KeyRound, Bell, Save, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  avatar_url?: string;
  phone?: string;
  display_name?: string;
}

export default function PerfilPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("info");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    systemNotifications: true,
  });

  // Carregar dados do perfil
  useEffect(() => {
    async function loadUserProfile() {
      if (!user) return;

      setIsLoading(true);
      try {
        // Buscar informações adicionais do perfil na tabela users
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProfile(data as UserProfile);
          setFormData({
            ...formData,
            name: data.name || "",
            display_name: data.display_name || "",
            phone: data.phone || "",
            emailNotifications: data.email_notifications !== false,
            systemNotifications: data.system_notifications !== false,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        setMessage({
          type: "error",
          text: "Não foi possível carregar os dados do perfil",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, [user]);

  // Funções para manipular formulários
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // Atualizar o perfil do usuário
      const { error } = await supabase
        .from("users")
        .update({
          name: formData.name,
          display_name: formData.display_name,
          phone: formData.phone,
          updated_at: new Date(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setMessage({
        type: "success",
        text: "Informações atualizadas com sucesso!",
      });

      // Atualizar os dados do usuário no contexto de autenticação
      refreshUser();
    } catch (error) {
      console.error("Erro ao atualizar informações:", error);
      setMessage({
        type: "error",
        text: "Erro ao atualizar informações. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validar senhas
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        type: "error",
        text: "A nova senha e a confirmação não coincidem",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "A nova senha deve ter pelo menos 6 caracteres",
      });
      return;
    }

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // Atualizar a senha do usuário
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) {
        throw error;
      }

      setMessage({
        type: "success",
        text: "Senha atualizada com sucesso!",
      });

      // Limpar campos de senha
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Erro ao atualizar senha:", error);
      setMessage({
        type: "error",
        text: "Erro ao atualizar senha. Verifique a senha atual e tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // Atualizar preferências de notificação
      const { error } = await supabase
        .from("users")
        .update({
          email_notifications: formData.emailNotifications,
          system_notifications: formData.systemNotifications,
          updated_at: new Date(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setMessage({
        type: "success",
        text: "Preferências de notificação atualizadas com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao atualizar notificações:", error);
      setMessage({
        type: "error",
        text: "Erro ao atualizar preferências de notificação. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Perfil do Usuário">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/configuracoes"
            className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Perfil do Usuário</h1>
        </div>

        {/* Mensagem de feedback */}
        {message.text && (
          <div
            className={`rounded-md p-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>{message.text}</span>
              </div>
            ) : (
              <span>{message.text}</span>
            )}
          </div>
        )}

        {/* Conteúdo principal */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
          {/* Abas */}
          <div className="flex border-b border-neutral-200">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "info"
                  ? "border-b-2 border-primary-500 text-primary-600"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
              onClick={() => setActiveTab("info")}
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Informações Pessoais</span>
              </div>
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "password"
                  ? "border-b-2 border-primary-500 text-primary-600"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
              onClick={() => setActiveTab("password")}
            >
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                <span>Alterar Senha</span>
              </div>
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "notifications"
                  ? "border-b-2 border-primary-500 text-primary-600"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
              onClick={() => setActiveTab("notifications")}
            >
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>Notificações</span>
              </div>
            </button>
          </div>

          {/* Conteúdo das abas */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <>
                {/* Aba de Informações Pessoais */}
                {activeTab === "info" && (
                  <form onSubmit={handleInfoSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          E-mail
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="mt-1 block w-full rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-neutral-500">
                          O e-mail não pode ser alterado
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          Nome Completo
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="display_name"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          Nome de Exibição
                        </label>
                        <input
                          id="display_name"
                          name="display_name"
                          type="text"
                          value={formData.display_name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-neutral-500">
                          Como seu nome será exibido no sistema
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          Telefone
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="text"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="role"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          Função
                        </label>
                        <input
                          id="role"
                          type="text"
                          value={profile?.role || ""}
                          disabled
                          className="mt-1 block w-full rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-neutral-500">
                          A função não pode ser alterada
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Salvar Alterações</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Aba de Alterar Senha */}
                {activeTab === "password" && (
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="currentPassword"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          Senha Atual
                        </label>
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="newPassword"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          Nova Senha
                        </label>
                        <input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          Confirmar Nova Senha
                        </label>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Atualizando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Atualizar Senha</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Aba de Notificações */}
                {activeTab === "notifications" && (
                  <form onSubmit={handleNotificationsSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                        <div>
                          <h3 className="text-base font-medium text-neutral-900">
                            Notificações por E-mail
                          </h3>
                          <p className="text-sm text-neutral-500">
                            Receba atualizações importantes por e-mail
                          </p>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="emailNotifications"
                            name="emailNotifications"
                            type="checkbox"
                            checked={formData.emailNotifications}
                            onChange={handleInputChange}
                            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                          />
                          <label
                            htmlFor="emailNotifications"
                            className="ml-2 text-sm text-neutral-700"
                          >
                            Ativar
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <h3 className="text-base font-medium text-neutral-900">
                            Notificações do Sistema
                          </h3>
                          <p className="text-sm text-neutral-500">
                            Receba notificações dentro do sistema
                          </p>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="systemNotifications"
                            name="systemNotifications"
                            type="checkbox"
                            checked={formData.systemNotifications}
                            onChange={handleInputChange}
                            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                          />
                          <label
                            htmlFor="systemNotifications"
                            className="ml-2 text-sm text-neutral-700"
                          >
                            Ativar
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Salvar Preferências</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 