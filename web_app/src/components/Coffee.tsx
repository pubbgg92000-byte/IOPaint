import { Coffee as CoffeeIcon } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog"
import { IconButton } from "./ui/button"
import { DialogDescription } from "@radix-ui/react-dialog"

export function Coffee() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <IconButton tooltip="Buy me a coffee">
          <CoffeeIcon />
        </IconButton>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Buy me a coffee</DialogTitle>
        <DialogDescription className="mb-8">
          Hi, if you found my project is useful, please conside buy me a coffee
          to support my work. Thanks!
        </DialogDescription>
        <div className="w-full flex items-center justify-center">
          <a
            href="https://ko-fi.com/Z8Z1CZJGY"
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Open Ko-fi
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default Coffee
