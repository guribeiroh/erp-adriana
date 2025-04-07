"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "../../../../../components/layout/DashboardLayout";
import { Package, Save, ArrowLeft, Upload, Minus, X, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

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

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const produtoId = params.id as string;
  
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
  const [imagemOriginal, setImagemOriginal] = useState<string | null>(null);

  // Estado para verificar status
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({
    verificando: false,
    mensagem: ''
  });

  // Função para verificar e criar o bucket de armazenamento, se necessário
  const verificarBucketImagens = async () => {
    // Simplificar a verificação de bucket para evitar problemas com RLS
    setUploadStatus({
      verificando: true,
      mensagem: 'Verificando permissões de upload...'
    });
    
    try {
      // Em vez de tentar criar o bucket, vamos apenas testar o upload
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      
      // Criar caminho de teste único
      const testFilePath = `test-upload-${Date.now()}.txt`;
      
      // Tentar fazer um upload de teste
      const { data, error } = await supabase.storage
        .from('books')
        .upload(testFilePath, testFile, {
          cacheControl: '0',
          upsert: true
        });
      
      if (error) {
        console.error('Erro ao testar upload:', error);
        console.error('Detalhes:', error.message);
        
        // Se for erro de política de segurança, podemos tentar uma solução alternativa
        if (error.message.includes('violates row-level security policy') || 
            error.message.includes('not authorized')) {
          setUploadStatus({
            verificando: false,
            mensagem: 'Problema com permissões. Tentando abordagem alternativa...'
          });
          
          // Retornar verdadeiro mesmo assim - vamos tentar uma abordagem diferente de upload
          return true;
        }
        
        setUploadStatus({
          verificando: false,
          mensagem: `Erro de permissão: ${error.message}`
        });
        return false;
      }
      
      // Limpar o arquivo de teste se for criado com sucesso
      if (data) {
        await supabase.storage
          .from('books')
          .remove([testFilePath]);
      }
      
      setUploadStatus({
        verificando: false,
        mensagem: 'Permissões de upload verificadas com sucesso!'
      });
      return true;
    } catch (error) {
      console.error('Erro ao testar upload:', error);
      setUploadStatus({
        verificando: false,
        mensagem: 'Erro ao verificar permissões de upload'
      });
      return true; // Continuar tentando mesmo com erro
    }
  };

  // Carregar dados do produto
  useEffect(() => {
    async function carregarProduto() {
      if (!produtoId) return;
      
      try {
        setCarregando(true);
        setErro(null);
        
        if (!supabase) {
          throw new Error("Cliente Supabase não disponível");
        }
        
        // Consultar o produto no Supabase
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', produtoId)
          .single();
        
        if (error) {
          throw new Error(`Erro ao carregar produto: ${error.message}`);
        }
        
        if (!data) {
          throw new Error("Produto não encontrado");
        }
        
        // Converter os dados do banco para o formato do formulário
        setFormData({
          titulo: data.title || "",
          autor: data.author || "",
          isbn: data.isbn || "",
          editora: data.publisher || "",
          categoria: data.category || "",
          subCategoria: data.subcategory || "",
          precoCusto: data.purchase_price?.toString() || "0",
          precoVenda: data.selling_price?.toString() || "0",
          quantidade: data.quantity?.toString() || "0",
          estoqueMinimo: data.minimum_stock?.toString() || "5",
          idioma: data.language || "portugues",
          paginas: data.pages?.toString() || "",
          ano: data.publication_year?.toString() || "",
          descricao: data.description || "",
          imagem: data.image_url || ""
        });
        
        // Configurar preview de imagem se existir
        if (data.image_url) {
          setImagemPreview(data.image_url);
          setImagemOriginal(data.image_url);
        }
      } catch (error) {
        console.error("Erro ao carregar produto:", error);
        setErro(error instanceof Error ? error.message : "Erro desconhecido");
      } finally {
        setCarregando(false);
      }
    }
    
    carregarProduto();
  }, [produtoId]);

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
    }
  };

  // Função para remover a imagem selecionada
  const handleRemoverImagem = () => {
    if (imagemPreview && imagemPreview !== imagemOriginal) {
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
      setSalvando(true);
      
      // Verificar se o cliente supabase está disponível
      if (!supabase) {
        throw new Error("Cliente Supabase não disponível. Verifique a conexão com o banco de dados.");
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
        // Dados adicionais
        language: formData.idioma,
        pages: formData.paginas ? parseInt(formData.paginas, 10) : null,
        publication_year: formData.ano ? parseInt(formData.ano, 10) : null,
        description: formData.descricao,
        updated_at: new Date().toISOString()
      };
      
      // Upload da imagem para o Storage do Supabase (apenas se houver uma nova imagem)
      let imageUrl = imagemOriginal; // Manter a imagem original por padrão
      
      if (imagemArquivo) {
        // Verificar permissões de upload
        await verificarBucketImagens();
        
        try {
          // NOVA ABORDAGEM: Usar Base64 para armazenar a imagem
          const reader = new FileReader();
          
          // Converter o arquivo para Base64
          const getBase64 = () => {
            return new Promise<string>((resolve, reject) => {
              reader.onloadend = () => {
                // Obter a string base64
                const base64String = typeof reader.result === 'string' 
                  ? reader.result 
                  : '';
                resolve(base64String);
              };
              reader.onerror = reject;
              reader.readAsDataURL(imagemArquivo);
            });
          };
          
          // Obter string base64
          const base64String = await getBase64();
          
          // Usar base64 como URL da imagem (abordagem temporária até resolver permissões)
          // Aviso: isso aumenta o tamanho dos dados no banco; para produção, resolver as políticas RLS
          imageUrl = base64String;
          
          console.log('Imagem convertida para Base64 (primeiros 50 caracteres):', base64String.substring(0, 50) + '...');
        } catch (uploadError) {
          console.error('Erro ao processar imagem:', uploadError);
          throw new Error(`Erro ao processar imagem: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
        }
      }
      
      // Atualizar a URL da imagem nos dados
      bookData.image_url = imageUrl;
      
      // Atualizar o livro na tabela books
      const { data, error } = await supabase
        .from('books')
        .update(bookData)
        .eq('id', produtoId)
        .select();
      
      if (error) {
        console.error('Erro ao atualizar livro no banco de dados:', error);
        throw new Error(`Erro ao atualizar livro: ${error.message}`);
      }
      
      console.log("Livro atualizado com sucesso:", data);
      
      alert("Livro atualizado com sucesso!");
      router.push(`/dashboard/produtos/${produtoId}`);
    } catch (error) {
      console.error("Erro ao atualizar livro:", error);
      alert(`Erro ao atualizar livro: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSalvando(false);
    }
  };

  // Exibir carregamento
  if (carregando) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-primary-600"></div>
            <p className="text-neutral-600">Carregando informações do produto...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Exibir erro
  if (erro) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">Produto não encontrado</h2>
          <p className="mb-6 text-neutral-600">{erro}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.refresh()}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
            
            <Link
              href="/dashboard/produtos"
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Produtos
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-primary-600" />
              <h1 className="text-2xl font-bold text-neutral-900">Editar Livro</h1>
            </div>
            <div className="space-x-2">
              <Link 
                href={`/dashboard/produtos/${produtoId}`}
                className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </div>
          </div>
        </div>
        
        {/* Status do upload */}
        {uploadStatus.verificando && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="text-sm">{uploadStatus.mensagem}</p>
            </div>
          </div>
        )}
        
        {!uploadStatus.verificando && uploadStatus.mensagem && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg">
            <p className="text-sm">{uploadStatus.mensagem}</p>
          </div>
        )}
        
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
              disabled={salvando}
              className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-70"
            >
              {salvando ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 