"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { Package, Save, ArrowLeft, Upload, Plus, Minus, X } from "lucide-react";
import { supabase, disableRLS } from "@/lib/supabase/client";

// Categorias de produtos disponíveis
const categorias = [
  { id: "romance", nome: "Romance" },
  { id: "ficcao", nome: "Ficção Científica" },
  { id: "fantasia", nome: "Fantasia" },
  { id: "biografia", nome: "Biografia" },
  { id: "historia", nome: "História" },
  { id: "negocios", nome: "Negócios" },
  { id: "autoajuda", nome: "Autoajuda" },
  { id: "infantil", nome: "Infantil" },
  { id: "academico", nome: "Acadêmico" },
  { id: "literatura_brasileira", nome: "Literatura Brasileira" }
];

// Idiomas disponíveis
const idiomas = [
  { id: "portugues", nome: "Português" },
  { id: "ingles", nome: "Inglês" },
  { id: "espanhol", nome: "Espanhol" },
  { id: "frances", nome: "Francês" },
  { id: "alemao", nome: "Alemão" },
  { id: "italiano", nome: "Italiano" },
  { id: "japones", nome: "Japonês" }
];

export default function NovoProdutoPage() {
  const router = useRouter();
  
  // Estado para o formulário
  const [formData, setFormData] = useState({
    titulo: "",
    autor: "",
    isbn: "",
    editora: "",
    categoria: "",
    subCategoria: "",
    precoCusto: "0",
    precoVenda: "0",
    quantidade: "0",
    estoqueMinimo: "5",
    idioma: "portugues",
    paginas: "",
    ano: "",
    descricao: "",
    imagem: ""
  });

  // Estado para o arquivo de imagem
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);

  // Estado para verificar status do Supabase
  const [supabaseStatus, setSupabaseStatus] = useState({
    isConnected: false,
    hasRLS: true,
    message: '',
    loading: true
  });

  // Verificar bucket de armazenamento de imagens
  const verificarBucketImagens = async () => {
    if (!supabase) return;
    
    try {
      // Verificar se o bucket 'books' existe
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Erro ao verificar buckets:', error);
        return;
      }
      
      const bookBucketExists = buckets.some(bucket => bucket.name === 'books');
      
      // Se o bucket não existir, criar
      if (!bookBucketExists) {
        console.log('Bucket "books" não existe. Criando...');
        const { data, error: createError } = await supabase.storage.createBucket('books', {
          public: true, // Bucket público para que as imagens sejam acessíveis
          fileSizeLimit: 5 * 1024 * 1024, // Limite de 5MB por arquivo
        });
        
        if (createError) {
          console.error('Erro ao criar bucket:', createError);
        } else {
          console.log('Bucket "books" criado com sucesso.');
        }
      } else {
        console.log('Bucket "books" já existe.');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar bucket:', error);
    }
  };

  // Verificar status do Supabase ao montar o componente
  useEffect(() => {
    async function checkSupabaseStatus() {
      try {
        if (!supabase) {
          setSupabaseStatus({
            isConnected: false,
            hasRLS: true,
            message: 'Cliente Supabase não disponível',
            loading: false
          });
          return;
        }
        
        // Testar conexão fazendo uma consulta simples
        const { data, error } = await supabase.from('books').select('count');
        
        if (error) {
          console.error('Erro ao verificar status do Supabase:', error);
          if (error.message.includes('permission denied')) {
            setSupabaseStatus({
              isConnected: true,
              hasRLS: true,
              message: 'Conectado ao Supabase, mas RLS está impedindo acesso',
              loading: false
            });
          } else {
            setSupabaseStatus({
              isConnected: false,
              hasRLS: true,
              message: `Erro ao conectar: ${error.message}`,
              loading: false
            });
          }
        } else {
          setSupabaseStatus({
            isConnected: true,
            hasRLS: false,
            message: 'Conectado ao Supabase com permissões corretas',
            loading: false
          });
          
          // Verificar e criar bucket de imagens se necessário
          await verificarBucketImagens();
        }
      } catch (error) {
        console.error('Erro ao verificar status do Supabase:', error);
        setSupabaseStatus({
          isConnected: false,
          hasRLS: true,
          message: `Erro inesperado: ${error instanceof Error ? error.message : String(error)}`,
          loading: false
        });
      }
    }
    
    checkSupabaseStatus();
  }, []);

  // Função para desabilitar RLS manualmente
  const handleDisableRLS = async () => {
    setSupabaseStatus(prev => ({ ...prev, loading: true }));
    try {
      // Tentar desabilitar RLS
      const result = await disableRLS();
      if (result.success) {
        setSupabaseStatus({
          isConnected: true,
          hasRLS: false,
          message: 'RLS desabilitado com sucesso!',
          loading: false
        });
      } else {
        setSupabaseStatus({
          isConnected: true,
          hasRLS: true,
          message: `Não foi possível desabilitar RLS: ${result.message}`,
          loading: false
        });
      }
    } catch (error) {
      console.error('Erro ao tentar desabilitar RLS:', error);
      setSupabaseStatus(prev => ({
        ...prev,
        message: `Erro ao desabilitar RLS: ${error instanceof Error ? error.message : String(error)}`,
        loading: false
      }));
    }
  };

  // Função para lidar com upload de imagem
  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Verificar se o arquivo é uma imagem
      if (!file.type.startsWith('image/')) {
        alert('Por favor, envie apenas arquivos de imagem.');
        return;
      }
      
      // Verificar o tamanho do arquivo (limitar a 5MB por exemplo)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem não pode ser maior que 5MB.');
        return;
      }
      
      setImagemArquivo(file);
      
      // Criar uma URL temporária para preview da imagem
      const url = URL.createObjectURL(file);
      setImagemPreview(url);
      
      // Por enquanto, apenas armazenamos a URL temporária no formData
      // Em uma implementação real, a URL seria gerada após o upload para o servidor/storage
      setFormData(prev => ({
        ...prev,
        imagem: url
      }));
    }
  };

  // Função para remover a imagem selecionada
  const handleRemoverImagem = () => {
    if (imagemPreview) {
      URL.revokeObjectURL(imagemPreview);
    }
    setImagemPreview(null);
    setImagemArquivo(null);
    setFormData(prev => ({
      ...prev,
      imagem: ""
    }));
  };

  // Função para atualizar os dados do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para lidar com a submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Verificar se o cliente supabase está disponível
      if (!supabase) {
        throw new Error("Cliente Supabase não está disponível. Verifique a conexão com o banco de dados.");
      }
      
      // Preparar os dados para enviar ao Supabase
      const bookData = {
        title: formData.titulo,
        author: formData.autor,
        isbn: formData.isbn,
        publisher: formData.editora,
        category: formData.categoria,
        subcategory: formData.subCategoria,
        purchase_price: parseFloat(formData.precoCusto),
        selling_price: parseFloat(formData.precoVenda),
        quantity: parseInt(formData.quantidade, 10),
        minimum_stock: parseInt(formData.estoqueMinimo, 10),
        // Dados adicionais não presentes na tabela original mas que serão armazenados como metadados
        image_url: formData.imagem,
        language: formData.idioma,
        pages: formData.paginas ? parseInt(formData.paginas, 10) : null,
        publication_year: formData.ano ? parseInt(formData.ano, 10) : null,
        description: formData.descricao
      };
      
      console.log("Dados preparados para enviar ao Supabase:", bookData);
      
      // Upload da imagem para o Storage do Supabase (se houver)
      let imageUrl = '';
      if (imagemArquivo) {
        const fileExt = imagemArquivo.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `book-covers/${fileName}`;
        
        // Upload da imagem para o storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('books')
          .upload(filePath, imagemArquivo);
        
        if (storageError) {
          throw new Error(`Erro ao fazer upload da imagem: ${storageError.message}`);
        }
        
        // Se o upload foi bem-sucedido, obter a URL pública
        const { data: urlData } = supabase.storage
          .from('books')
          .getPublicUrl(filePath);
          
        if (urlData) {
          imageUrl = urlData.publicUrl;
          bookData.image_url = imageUrl;
        }
      }
      
      // Salvar o livro na tabela books
      const { data, error } = await supabase
        .from('books')
        .insert([bookData])
        .select();
      
      if (error) {
        throw new Error(`Erro ao salvar livro: ${error.message}`);
      }
      
      console.log("Livro cadastrado com sucesso:", data);
      
      alert("Livro cadastrado com sucesso!");
      router.push("/dashboard/produtos");
    } catch (error) {
      console.error("Erro ao cadastrar livro:", error);
      alert(`Erro ao cadastrar livro: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-primary-600" />
              <h1 className="text-2xl font-bold text-neutral-900">Cadastrar Novo Livro</h1>
            </div>
            <div className="space-x-2">
              <Link 
                href="/dashboard/produtos"
                className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </div>
          </div>
        </div>
         
        {/* Status do Supabase */}
        {supabaseStatus.loading ? (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg flex items-center">
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <p>Verificando conexão com o Supabase...</p>
          </div>
        ) : !supabaseStatus.isConnected ? (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            <p className="font-semibold">Sem conexão com o Supabase</p>
            <p className="text-sm">{supabaseStatus.message}</p>
          </div>
        ) : supabaseStatus.hasRLS ? (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
            <p className="font-semibold">Restrições de segurança ativas</p>
            <p className="text-sm">{supabaseStatus.message}</p>
            <button 
              onClick={handleDisableRLS}
              className="mt-2 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-1 px-2 rounded"
            >
              Desabilitar Restrições
            </button>
          </div>
        ) : null}
        
        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna da esquerda - Upload da imagem */}
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Capa do Livro</h2>
                
                <div className="aspect-[3/4] w-full overflow-hidden rounded bg-neutral-100 mb-4 flex items-center justify-center">
                  {imagemPreview ? (
                    <div className="relative h-full w-full">
                      <img 
                        src={imagemPreview} 
                        alt="Preview da capa" 
                        className="h-full w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoverImagem}
                        className="absolute top-2 right-2 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <Package className="h-16 w-16 mx-auto text-neutral-400" />
                      <p className="mt-2 text-sm text-neutral-500">Nenhuma imagem selecionada</p>
                      <p className="text-xs text-neutral-400">Formato recomendado: JPG, PNG ou WEBP</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                  <label 
                    htmlFor="upload-capa" 
                    className="cursor-pointer flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <Upload className="h-4 w-4" />
                    {imagemPreview ? "Trocar Imagem" : "Fazer Upload da Capa"}
                  </label>
                  <input 
                    type="file" 
                    id="upload-capa" 
                    accept="image/*" 
                    onChange={handleImagemChange} 
                    className="hidden" 
                  />
                  
                  {imagemPreview && (
                    <button
                      type="button"
                      onClick={handleRemoverImagem}
                      className="flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                      Remover Imagem
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Colunas da direita - Dados do livro */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Informações Básicas</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="titulo" className="block text-sm font-medium text-neutral-700">
                      Título
                    </label>
                    <input
                      type="text"
                      id="titulo"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="autor" className="block text-sm font-medium text-neutral-700">
                      Autor
                    </label>
                    <input
                      type="text"
                      id="autor"
                      name="autor"
                      value={formData.autor}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="isbn" className="block text-sm font-medium text-neutral-700">
                      ISBN
                    </label>
                    <input
                      type="text"
                      id="isbn"
                      name="isbn"
                      value={formData.isbn}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="editora" className="block text-sm font-medium text-neutral-700">
                      Editora
                    </label>
                    <input
                      type="text"
                      id="editora"
                      name="editora"
                      value={formData.editora}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="categoria" className="block text-sm font-medium text-neutral-700">
                      Categoria
                    </label>
                    <select
                      id="categoria"
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subCategoria" className="block text-sm font-medium text-neutral-700">
                      Subcategoria
                    </label>
                    <input
                      type="text"
                      id="subCategoria"
                      name="subCategoria"
                      value={formData.subCategoria}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="idioma" className="block text-sm font-medium text-neutral-700">
                      Idioma
                    </label>
                    <select
                      id="idioma"
                      name="idioma"
                      value={formData.idioma}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    >
                      {idiomas.map(idioma => (
                        <option key={idioma.id} value={idioma.id}>{idioma.nome}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="paginas" className="block text-sm font-medium text-neutral-700">
                      Número de Páginas
                    </label>
                    <input
                      type="number"
                      id="paginas"
                      name="paginas"
                      value={formData.paginas}
                      onChange={handleChange}
                      min="1"
                      className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="ano" className="block text-sm font-medium text-neutral-700">
                      Ano de Publicação
                    </label>
                    <input
                      type="number"
                      id="ano"
                      name="ano"
                      value={formData.ano}
                      onChange={handleChange}
                      min="1800"
                      max={new Date().getFullYear()}
                      className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label htmlFor="descricao" className="block text-sm font-medium text-neutral-700">
                    Descrição
                  </label>
                  <textarea
                    id="descricao"
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Informações de Preço e Estoque</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="precoCusto" className="block text-sm font-medium text-neutral-700">
                      Preço de Custo (R$)
                    </label>
                    <input
                      type="number"
                      id="precoCusto"
                      name="precoCusto"
                      value={formData.precoCusto}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="precoVenda" className="block text-sm font-medium text-neutral-700">
                      Preço de Venda (R$)
                    </label>
                    <input
                      type="number"
                      id="precoVenda"
                      name="precoVenda"
                      value={formData.precoVenda}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="quantidade" className="block text-sm font-medium text-neutral-700">
                      Quantidade em Estoque
                    </label>
                    <input
                      type="number"
                      id="quantidade"
                      name="quantidade"
                      value={formData.quantidade}
                      onChange={handleChange}
                      min="0"
                      className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="estoqueMinimo" className="block text-sm font-medium text-neutral-700">
                      Estoque Mínimo
                    </label>
                    <input
                      type="number"
                      id="estoqueMinimo"
                      name="estoqueMinimo"
                      value={formData.estoqueMinimo}
                      onChange={handleChange}
                      min="0"
                      className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Livro
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 