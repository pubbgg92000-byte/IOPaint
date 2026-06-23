import { useState } from "react"
import useResolution from "@/hooks/useResolution"

type FileSelectProps = {
  onSelection: (files: File[]) => void
}

export default function FileSelect(props: FileSelectProps) {
  const { onSelection } = props

  const [uploadElemId] = useState(`file-upload-${Math.random().toString()}`)

  const resolution = useResolution()

  function onFilesSelected(files: File[]) {
    const imageFiles = files.filter((file) => file.type.match("image.*"))
    const oversizedFile = imageFiles.find(
      (file) => file.size > 20 * 1024 * 1024
    )

    if (oversizedFile) {
      alert(`error: ${oversizedFile.name} is larger than 20 MB`)
      return
    }

    if (imageFiles.length > 0) {
      onSelection(imageFiles)
    }
  }

  return (
    <div className="absolute flex w-screen h-screen justify-center items-center pointer-events-none">
      <label
        htmlFor={uploadElemId}
        className="grid bg-background border-[2px] border-[dashed] rounded-lg min-w-[600px] hover:bg-primary hover:text-primary-foreground pointer-events-auto"
      >
        <div
          className="grid p-16 w-full h-full"
          onDragOver={(ev) => {
            ev.stopPropagation()
            ev.preventDefault()
          }}
        >
          <input
            className="hidden"
            id={uploadElemId}
            name={uploadElemId}
            type="file"
            multiple
            onChange={(ev) => {
              const files = Array.from(ev.currentTarget.files ?? [])
              if (files.length > 0) {
                onFilesSelected(files)
              }
            }}
            accept="image/png, image/jpeg, image/webp, image/bmp, image/tiff"
          />
          <p className="text-center">
            {resolution === "desktop"
              ? "Click here or drag image files"
              : "Tap here to load your pictures"}
          </p>
        </div>
      </label>
    </div>
  )
}
