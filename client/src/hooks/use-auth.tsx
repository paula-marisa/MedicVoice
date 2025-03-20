import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  QueryFunctionContext,
} from "@tanstack/react-query";
import { User, type InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Tipo para login (username e password)
type LoginData = Pick<InsertUser, "username" | "password">;

// Tipo para registro (todos os campos do InsertUser)
type RegisterData = InsertUser;

// Tipo do contexto de autenticação
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

// Criação do contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Provider de autenticação
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Query para obter usuário autenticado
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/user");
        if (response.status === 401) {
          return null;
        }
        if (!response.ok) {
          throw new Error("Erro ao obter dados do usuário");
        }
        return await response.json();
      } catch (error) {
        console.error("Erro na autenticação:", error);
        return null;
      }
    },
  });

  // Mutation para login
  const loginMutation = useMutation<User, Error, LoginData>({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Credenciais inválidas");
      }
      return await res.json();
    },
    onSuccess: (userData) => {
      // Atualiza o cache com o novo usuário
      queryClient.setQueryData(["/api/user"], userData);
      
      // Exibe mensagem de sucesso
      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${userData.name}!`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  // Mutation para registro
  const registerMutation = useMutation<User, Error, RegisterData>({
    mutationFn: async (userData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Falha no registro");
      }
      return await res.json();
    },
    onSuccess: (userData) => {
      // Atualiza o cache com o novo usuário
      queryClient.setQueryData(["/api/user"], userData);
      
      // Exibe mensagem de sucesso
      toast({
        title: "Registro realizado",
        description: `Conta criada com sucesso. Bem-vindo, ${userData.name}!`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message || "Não foi possível criar a conta",
        variant: "destructive",
      });
    },
  });

  // Mutation para logout
  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Falha ao realizar logout");
      }
      return;
    },
    onSuccess: () => {
      // Limpa o cache do usuário
      queryClient.setQueryData(["/api/user"], null);
      
      // Exibe mensagem de sucesso
      toast({
        title: "Logout realizado",
        description: "Sessão encerrada com sucesso",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}