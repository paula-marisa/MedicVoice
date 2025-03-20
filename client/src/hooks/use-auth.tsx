import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, type InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
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
  loginMutation: UseMutationResult<any, Error, LoginData>;
  logoutMutation: UseMutationResult<any, Error, void>;
  registerMutation: UseMutationResult<any, Error, RegisterData>;
};

// Criação do contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Provider de autenticação
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Query para obter usuário autenticado
  const {
    data: userResponse,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Extrai o usuário da resposta
  const user = userResponse?.success ? userResponse.user : null;

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (response) => {
      if (response.success) {
        // Atualiza o cache com o novo usuário
        queryClient.setQueryData(["/api/user"], response);
        
        // Exibe mensagem de sucesso
        toast({
          title: "Login realizado",
          description: `Bem-vindo, ${response.user.name}!`,
          variant: "default",
        });
      } else {
        throw new Error(response.message || "Falha no login");
      }
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
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (response) => {
      if (response.success) {
        // Atualiza o cache com o novo usuário
        queryClient.setQueryData(["/api/user"], response);
        
        // Exibe mensagem de sucesso
        toast({
          title: "Registro realizado",
          description: `Conta criada com sucesso. Bem-vindo, ${response.user.name}!`,
          variant: "default",
        });
      } else {
        throw new Error(response.message || "Falha no registro");
      }
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
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      return await res.json();
    },
    onSuccess: () => {
      // Limpa o cache do usuário
      queryClient.setQueryData(["/api/user"], { success: false, user: null });
      
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