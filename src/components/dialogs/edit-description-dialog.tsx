import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { useState } from "react"
import { useMutation, useQueryClient } from "react-query"
import { createUseDialog } from "./create-use-dialog"
import { useAxios } from "@/hooks/use-axios"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "../ui/textarea"

export const UpdateDescriptionDialog = ({
  open,
  onOpenChange,
  snippetId,
  currentDescription,
  onUpdate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  snippetId: string
  currentDescription: string
  onUpdate?: (newDescription: string) => void
}) => {
  const [newDescription, setNewDescription] = useState(currentDescription)
  const axios = useAxios()
  const { toast } = useToast()
  const qc = useQueryClient()

  const updateDescriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post("/snippets/update", {
        snippet_id: snippetId,
        description: newDescription,
      })
      if (response.status !== 200) {
        throw new Error("Failed to update description")
      }
      return response.data
    },
    onSuccess: () => {
      onUpdate?.(newDescription)
      onOpenChange(false)
      toast({
        title: "Description updated",
        description: "Successfully updated snippet description",
      })
      qc.invalidateQueries({ queryKey: ["snippets", snippetId] })
    },
    onError: (error) => {
      console.error("Error updating description:", error)
      toast({
        title: "Error",
        description: "Failed to update the description. Please try again.",
        variant: "destructive",
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Description</DialogTitle>
        </DialogHeader>
        <Textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Enter new description"
          disabled={updateDescriptionMutation.isLoading}
          className="resize-none min-h-[80px]"
        />
        <Button
          disabled={updateDescriptionMutation.isLoading}
          onClick={() => updateDescriptionMutation.mutate()}
        >
          {updateDescriptionMutation.isLoading ? "Updating..." : "Update"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export const useUpdateDescriptionDialog = createUseDialog(
  UpdateDescriptionDialog,
)
