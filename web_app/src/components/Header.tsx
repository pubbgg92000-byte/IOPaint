import { PlayIcon } from "@radix-ui/react-icons"
import { useState } from "react"
import { IconButton, ImageUploadButton } from "@/components/ui/button"
import Shortcuts from "@/components/Shortcuts"
import { useImage } from "@/hooks/useImage"

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import PromptInput from "./PromptInput"
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Download,
  Image,
  Pencil,
  RotateCw,
  Trash2,
  Upload,
} from "lucide-react"
import { zipSync } from "fflate"
import FileManager, { MASK_TAB } from "./FileManager"
import { getMediaBlob, getMediaFile } from "@/lib/api"
import { useStore } from "@/lib/states"
import SettingsDialog from "./Settings"
import { cn, downloadBlob, fileToImage } from "@/lib/utils"
import Coffee from "./Coffee"
import { useToast } from "./ui/use-toast"

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

const Header = () => {
  const [
    file,
    customMask,
    isInpainting,
    serverConfig,
    runMannually,
    enableUploadMask,
    model,
    setFile,
    setCustomFile,
    runInpainting,
    showPrevMask,
    hidePrevMask,
    imageHeight,
    imageWidth,
    handleFileManagerMaskSelect,
    bulkImages,
    activeBulkImageId,
    addBulkFiles,
    selectBulkImage,
    selectNextBulkImage,
    selectPreviousBulkImage,
    snapshotCurrentBulkImage,
    renameBulkImage,
    clearBulkImages,
    activeRenderCount,
  ] = useStore((state) => [
    state.file,
    state.customMask,
    state.isInpainting,
    state.serverConfig,
    state.runMannually(),
    state.settings.enableUploadMask,
    state.settings.model,
    state.setFile,
    state.setCustomFile,
    state.runInpainting,
    state.showPrevMask,
    state.hidePrevMask,
    state.imageHeight,
    state.imageWidth,
    state.handleFileManagerMaskSelect,
    state.bulkImages,
    state.activeBulkImageId,
    state.addBulkFiles,
    state.selectBulkImage,
    state.selectNextBulkImage,
    state.selectPreviousBulkImage,
    state.snapshotCurrentBulkImage,
    state.renameBulkImage,
    state.clearBulkImages,
    state.editorState.renders.length,
  ])

  const { toast } = useToast()
  const [maskImage, maskImageLoaded] = useImage(customMask)
  const [openMaskPopover, setOpenMaskPopover] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const activeBulkIndex = bulkImages.findIndex(
    (image) => image.id === activeBulkImageId
  )
  const activeBulkImage = bulkImages[activeBulkIndex]

  const getExportBlob = async (item: (typeof bulkImages)[number]) => {
    const renders = item.session?.editorState.renders ?? []
    if (renders.length === 0) {
      return item.file
    }
    const render = renders[renders.length - 1]
    const response = await fetch(render.currentSrc || render.src)
    if (!response.ok) {
      throw new Error(`Could not prepare ${item.name}`)
    }
    return response.blob()
  }

  const prepareBulkImages = () => {
    snapshotCurrentBulkImage()
    return useStore.getState().bulkImages
  }

  const handleDownloadCurrent = async () => {
    const items = prepareBulkImages()
    const item = items.find((image) => image.id === activeBulkImageId)
    if (!item) return

    try {
      setIsExporting(true)
      downloadBlob(await getExportBlob(item), item.name)
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        description: errorMessage(error),
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadZip = async () => {
    const items = prepareBulkImages()
    if (items.length === 0) return

    try {
      setIsExporting(true)
      const usedNames = new Set<string>()
      const files: Record<string, Uint8Array> = {}

      for (const item of items) {
        const safeName = item.name.replace(/[\\/:*?"<>|]/g, "_")
        const extensionIndex = safeName.lastIndexOf(".")
        const base =
          extensionIndex > 0 ? safeName.slice(0, extensionIndex) : safeName
        const extension =
          extensionIndex > 0 ? safeName.slice(extensionIndex) : ""
        let uniqueName = safeName
        let suffix = 2
        while (usedNames.has(uniqueName.toLowerCase())) {
          uniqueName = `${base} (${suffix})${extension}`
          suffix += 1
        }
        usedNames.add(uniqueName.toLowerCase())

        const blob = await getExportBlob(item)
        files[uniqueName] = new Uint8Array(await blob.arrayBuffer())
      }

      downloadBlob(
        new Blob([zipSync(files, { level: 0 })], { type: "application/zip" }),
        "iopaint-images.zip"
      )
      toast({ description: `Downloaded ${items.length} images as a ZIP` })
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        description: errorMessage(error),
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleRename = () => {
    if (!activeBulkImage) return
    const nextName = window.prompt("Rename image", activeBulkImage.name)?.trim()
    if (!nextName) return

    const oldExtension = activeBulkImage.name.match(/\.[^./]+$/)?.[0] ?? ""
    const nameWithExtension = /\.[^./]+$/.test(nextName)
      ? nextName
      : `${nextName}${oldExtension}`
    renameBulkImage(activeBulkImage.id, nameWithExtension)
  }

  const handleRerunLastMask = () => {
    runInpainting()
  }

  const onRerunMouseEnter = () => {
    showPrevMask()
  }

  const onRerunMouseLeave = () => {
    hidePrevMask()
  }

  const handleOnPhotoClick = async (tab: string, filename: string) => {
    try {
      if (tab === MASK_TAB) {
        const maskBlob = await getMediaBlob(tab, filename)
        handleFileManagerMaskSelect(maskBlob)
      } else {
        const newFile = await getMediaFile(tab, filename)
        setFile(newFile)
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        description: e.message ? e.message : e.toString(),
      })
      return
    }
  }

  return (
    <header className="h-[60px] px-6 py-4 absolute top-[0] flex justify-between items-center w-full z-20 border-b backdrop-filter backdrop-blur-md bg-background/70">
      <div className="flex items-center gap-1">
        {serverConfig.enableFileManager ? (
          <FileManager photoWidth={512} onPhotoClick={handleOnPhotoClick} />
        ) : (
          <></>
        )}

        <ImageUploadButton
          disabled={isInpainting}
          tooltip="Upload images"
          multiple
          onFileUpload={(file) => {
            addBulkFiles([file])
          }}
          onFilesUpload={(files) => {
            addBulkFiles(files)
          }}
        >
          <Image />
        </ImageUploadButton>

        {bulkImages.length > 0 ? (
          <div className="flex items-center gap-1 rounded-md border bg-background px-1 py-0.5">
            <IconButton
              disabled={isInpainting || bulkImages.length < 2}
              tooltip="Previous image"
              onClick={selectPreviousBulkImage}
            >
              <ChevronLeft />
            </IconButton>
            <select
              className="h-8 max-w-[180px] bg-background px-2 text-xs outline-none"
              disabled={isInpainting}
              value={activeBulkImageId ?? ""}
              onChange={(event) => {
                selectBulkImage(event.currentTarget.value)
              }}
            >
              {bulkImages.map((image, index) => (
                <option key={image.id} value={image.id}>
                  {index + 1}. {image.name}
                  {(image.id === activeBulkImageId
                    ? activeRenderCount > 0
                    : (image.session?.editorState.renders.length ?? 0) > 0)
                    ? " (edited)"
                    : ""}
                </option>
              ))}
            </select>
            <span className="w-12 text-center text-xs text-muted-foreground">
              {activeBulkIndex + 1}/{bulkImages.length}
            </span>
            <IconButton
              disabled={isInpainting || bulkImages.length < 2}
              tooltip="Next image"
              onClick={selectNextBulkImage}
            >
              <ChevronRight />
            </IconButton>
            <IconButton
              disabled={isInpainting || isExporting}
              tooltip="Rename current image"
              onClick={handleRename}
            >
              <Pencil />
            </IconButton>
            <IconButton
              disabled={isInpainting || isExporting}
              tooltip="Download current image"
              onClick={handleDownloadCurrent}
            >
              <Download />
            </IconButton>
            <IconButton
              disabled={isInpainting || isExporting}
              tooltip="Download all images as ZIP"
              onClick={handleDownloadZip}
            >
              <Archive />
            </IconButton>
            <IconButton
              disabled={isInpainting}
              tooltip="Clear image queue"
              onClick={clearBulkImages}
            >
              <Trash2 />
            </IconButton>
          </div>
        ) : (
          <></>
        )}

        <div
          className={cn([
            "flex items-center gap-1",
            file && enableUploadMask ? "visible" : "hidden",
          ])}
        >
          <ImageUploadButton
            disabled={isInpainting}
            tooltip="Upload custom mask"
            onFileUpload={async (file) => {
              let newCustomMask: HTMLImageElement | null = null
              try {
                newCustomMask = await fileToImage(file)
              } catch (e: any) {
                toast({
                  variant: "destructive",
                  description: e.message ? e.message : e.toString(),
                })
                return
              }
              if (
                newCustomMask.naturalHeight !== imageHeight ||
                newCustomMask.naturalWidth !== imageWidth
              ) {
                toast({
                  variant: "destructive",
                  description: `The size of the mask must same as image: ${imageWidth}x${imageHeight}`,
                })
                return
              }

              setCustomFile(file)
              if (!runMannually) {
                runInpainting()
              }
            }}
          >
            <Upload />
          </ImageUploadButton>

          {customMask ? (
            <Popover open={openMaskPopover}>
              <PopoverTrigger
                className="btn-primary side-panel-trigger"
                onMouseEnter={() => setOpenMaskPopover(true)}
                onMouseLeave={() => setOpenMaskPopover(false)}
                style={{
                  visibility: customMask ? "visible" : "hidden",
                  outline: "none",
                }}
                onClick={() => {
                  if (customMask) {
                  }
                }}
              >
                <IconButton tooltip="Run custom mask">
                  <PlayIcon />
                </IconButton>
              </PopoverTrigger>
              <PopoverContent>
                {maskImageLoaded ? (
                  <img src={maskImage.src} alt="Custom mask" />
                ) : (
                  <></>
                )}
              </PopoverContent>
            </Popover>
          ) : (
            <></>
          )}
        </div>

        {file && !model.need_prompt ? (
          <IconButton
            disabled={isInpainting}
            tooltip="Rerun previous mask"
            onClick={handleRerunLastMask}
            onMouseEnter={onRerunMouseEnter}
            onMouseLeave={onRerunMouseLeave}
          >
            <RotateCw />
          </IconButton>
        ) : (
          <></>
        )}
      </div>

      {model.need_prompt ? <PromptInput /> : <></>}

      <div className="flex gap-1">
        <Coffee />
        <Shortcuts />
        {serverConfig.disableModelSwitch ? <></> : <SettingsDialog />}
      </div>
    </header>
  )
}

export default Header
