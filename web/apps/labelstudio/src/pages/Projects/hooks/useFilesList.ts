import { useQuery } from '@tanstack/react-query';
import { useAPI } from '../../../providers/ApiProvider';

export interface FileItem {
  id: number;
  file_name: string;
  file_type: string;
  created_at: string;
  status: string;
  task_count: number;
  project_id: number;
  project_title: string;
  uploaded_by: string;
}

export interface FilesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FileItem[];
}

export interface UseFilesListParams {
  projectId?: number;
  page: number;
  pageSize: number;
  filters?: {
    fileType?: string | null;
    status?: string | null;
  };
  enabled?: boolean;
}

export interface UseFilesListReturn {
  files: FileItem[];
  totalFiles: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useFilesList = ({
  projectId,
  page,
  pageSize,
  filters = {},
  enabled = true,
}: UseFilesListParams): UseFilesListReturn => {
  const api = useAPI();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<FilesResponse, Error>({
    queryKey: ['project-file-uploads', projectId, page, pageSize, filters],
    queryFn: async () => {
      const params: Record<string, any> = {
        pk: projectId,
        page,
        page_size: pageSize,
        is_parent: true,
      };

      if (filters.fileType) {
        params.file_type = filters.fileType;
      }

      if (filters.status) {
        params.status = filters.status;
      }

      const result = await api.callApi<FilesResponse>('fileUploads', {
        params,
        suppressError: true,
      });

      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to fetch files');
      }

      return result as FilesResponse;
    },
    enabled: enabled && !!projectId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  return {
    files: data?.results || [],
    totalFiles: data?.count || 0,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
};
