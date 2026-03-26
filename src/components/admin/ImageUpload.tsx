import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label: string;
    bucket?: string;
    folder?: string;
}

export function ImageUpload({ value, onChange, label, bucket = 'admin-assets', folder = 'general' }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onChange(publicUrl);
            toast.success('Imagem enviada com sucesso!');
        } catch (error: any) {
            toast.error('Erro no envio: ' + error.message);
        } finally {
            setUploading(false);
        }
    }

    function removeImage() {
        onChange('');
    }

    return (
        <div className="space-y-2">
            <Label>{label}</Label>

            {value ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border group">
                    <img src={value} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={removeImage}
                            className="rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-muted/30">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium">Nenhuma imagem selecionada</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP de até 5MB</p>
                    </div>
                    <Button variant="outline" size="sm" className="relative cursor-pointer" disabled={uploading}>
                        {uploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4 mr-2" />
                        )}
                        {uploading ? 'Enviando...' : 'Selecionar Imagem'}
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleUpload}
                            accept="image/*"
                            disabled={uploading}
                        />
                    </Button>
                </div>
            )}

            <div className="flex gap-2">
                <Input
                    placeholder="Ou cole o link de uma imagem externa"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="text-xs"
                />
            </div>
        </div>
    );
}
