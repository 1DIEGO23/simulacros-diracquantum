// Componente para subir imágenes a Supabase Storage

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'

export default function SubirImagen({ onImagenSubida, imagenActual }) {
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(imagenActual || null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede pesar más de 5MB')
      return
    }

    setSubiendo(true)
    setError('')

    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from('preguntas')
        .upload(fileName, file)

      if (error) {
        setError('Error al subir la imagen. Inténtalo de nuevo.')
        return
      }

      // Obtener la URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('preguntas')
        .getPublicUrl(fileName)

      setPreview(publicUrl)

      // Notificar al componente padre
      if (onImagenSubida) {
        onImagenSubida(publicUrl)
      }
    } catch (err) {
      setError('Error al subir la imagen. Inténtalo de nuevo.')
    } finally {
      setSubiendo(false)
    }
  }

  const handleEliminar = () => {
    setPreview(null)
    if (onImagenSubida) {
      onImagenSubida(null)
    }
  }

  return (
    <div style={{ marginBottom: '15px' }}>
      <label style={{
        display: 'block',
        color: brand.colors.text,
        marginBottom: '5px',
        fontSize: '14px',
      }}>
        Imagen (opcional)
      </label>

      {preview ? (
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <img
            src={preview}
            alt="Vista previa"
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
              borderRadius: '8px',
              border: `1px solid ${brand.colors.violetNeon}`,
            }}
          />
          <button
            onClick={handleEliminar}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: brand.colors.error,
              color: brand.colors.text,
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Eliminar
          </button>
        </div>
      ) : (
        <div style={{
          border: `2px dashed ${brand.colors.violetNeon}`,
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: 'rgba(139, 92, 246, 0.05)',
        }}>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            disabled={subiendo}
            style={{ display: 'none' }}
            id="imagen-input"
          />
          <label
            htmlFor="imagen-input"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              borderRadius: '6px',
              backgroundColor: brand.colors.violetNeon,
              color: brand.colors.text,
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: subiendo ? 'not-allowed' : 'pointer',
              opacity: subiendo ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {subiendo ? 'Subiendo...' : 'Seleccionar imagen'}
          </label>
          <p style={{
            color: brand.colors.textMuted,
            fontSize: '12px',
            marginTop: '10px',
          }}>
            Formatos: JPG, PNG, GIF. Máximo 5MB.
          </p>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          borderRadius: '6px',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          border: `1px solid ${brand.colors.error}`,
          color: brand.colors.error,
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
