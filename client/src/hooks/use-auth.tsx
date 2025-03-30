import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, type InsertUser } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Tipos para mutações
type LoginData = Pick<InsertUser, "username" | "password">;
type RegisterData = InsertUser;

// Tipo do contexto de autenticação
interface AuthContextType {
  user: User | null;
  profileImage: string | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  updateProfileImage: (imageUrl: string) => void;
}

// Criação do contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Hook para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

// Provider de autenticação
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  // Carrega o perfil do usuário quando ele for autenticado
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Query para obter usuário autenticado
  const {
    data: userData,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        console.log("Verificando usuário autenticado");
        const response = await fetch("/api/user", {
          credentials: "include"  // Importante para enviar cookies
        });
        console.log("Status da resposta /api/user:", response.status);
        
        if (response.status === 401) {
          console.log("Usuário não autenticado (401)");
          return null;
        }
        
        if (!response.ok) {
          console.error("Erro na resposta /api/user:", response.statusText);
          throw new Error("Erro ao obter dados do usuário");
        }
        
        const data = await response.json();
        console.log("Dados do usuário:", data);
        
        if (!data.success || !data.user) {
          console.log("Resposta sem dados de usuário válidos:", data);
          return null;
        }
        
        return data.user;
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        return null;
      }
    },
  });

  const user = userData || null;
  
  // Carrega a imagem de perfil específica do usuário quando o usuário muda
  useEffect(() => {
    if (user) {
      const savedImage = localStorage.getItem(`profileImage_${user.id}`);
      if (savedImage) {
        setProfileImage(savedImage);
      } else {
        setProfileImage(null);
      }
    } else {
      setProfileImage(null);
    }
  }, [user]);

  // Mutation para login
  const loginMutation = useMutation<User, Error, LoginData>({
    mutationFn: async (credentials) => {
      try {
        console.log("Tentando login com:", credentials);
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include"
        });
        console.log("Status da resposta:", res.status);
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Erro na resposta:", errorData);
          throw new Error(errorData.message || "Credenciais inválidas");
        }
        
        const data = await res.json();
        console.log("Dados da resposta:", data);
        
        if (!data.success || !data.user) {
          console.error("Resposta sem dados de usuário:", data);
          throw new Error(data.message || "Resposta inválida do servidor");
        }
        
        return data.user;
      } catch (err) {
        console.error("Erro no login:", err);
        throw err;
      }
    },
    onSuccess: (userData) => {
      console.log("Login bem-sucedido:", userData);
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
      console.error("Erro no login (callback):", error);
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
      try {
        console.log("Tentando registrar:", userData);
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
          credentials: "include"
        });
        console.log("Status da resposta de registro:", res.status);
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Erro na resposta de registro:", errorData);
          throw new Error(errorData.message || "Falha no registro");
        }
        
        const data = await res.json();
        console.log("Dados da resposta de registro:", data);
        
        if (!data.success || !data.user) {
          console.error("Resposta de registro sem dados de usuário:", data);
          throw new Error(data.message || "Resposta inválida do servidor");
        }
        
        return data.user;
      } catch (err) {
        console.error("Erro no registro:", err);
        throw err;
      }
    },
    onSuccess: (userData) => {
      console.log("Registro bem-sucedido:", userData);
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
      console.error("Erro no registro (callback):", error);
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
      try {
        console.log("Tentando fazer logout");
        const res = await fetch("/api/logout", {
          method: "POST",
          credentials: "include"
        });
        console.log("Status da resposta de logout:", res.status);
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Erro na resposta de logout:", errorData);
          throw new Error(errorData.message || "Falha ao realizar logout");
        }
        
        return;
      } catch (err) {
        console.error("Erro no logout:", err);
        throw err;
      }
    },
    onSuccess: () => {
      console.log("Logout bem-sucedido");
      // Limpa o cache do usuário e a imagem de perfil
      queryClient.setQueryData(["/api/user"], null);
      setProfileImage(null);
      
      // Exibe mensagem de sucesso
      toast({
        title: "Logout realizado",
        description: "Sessão encerrada com sucesso",
        variant: "default",
      });
      
      // Redireciona para a página de login
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      console.error("Erro no logout (callback):", error);
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para atualizar a imagem de perfil
  const updateProfileImage = (imageUrl: string) => {
    setProfileImage(imageUrl);
    if (user) {
      localStorage.setItem(`profileImage_${user.id}`, imageUrl);
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        profileImage,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateProfileImage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}