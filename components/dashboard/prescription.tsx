'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { User } from "@/lib/types"

interface Prescription {
  id: string
  patientName: string
  medications: {
    name: string
    dosage: string
    frequency: string
    duration: string
  }[]
  instructions: string
  issuedDate: string
  nextRefillDate: string
  doctorName: string
}

interface PrescriptionComponentProps {
  me: User
  patientName: string
  prescriptions: Prescription[]
  onSave?: (prescription: Omit<Prescription, 'id'>) => Promise<void>
}

export default function PrescriptionComponent({ me, patientName, prescriptions, onSave }: PrescriptionComponentProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: ''
  })
  const [newInstructions, setNewInstructions] = useState('')
  const [nextRefillDate, setNextRefillDate] = useState('')

  const handleSave = async () => {
    if (!onSave) return

    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency || !newMedication.duration) {
      toast({
        title: "Missing information",
        description: "Please fill in all medication details",
        variant: "destructive"
      })
      return
    }

    try {
      await onSave({
        patientName,
        medications: [newMedication],
        instructions: newInstructions,
        issuedDate: new Date().toISOString(),
        nextRefillDate,
        doctorName: me.name
      })

      setIsEditing(false)
      setNewMedication({
        name: '',
        dosage: '',
        frequency: '',
        duration: ''
      })
      setNewInstructions('')
      setNextRefillDate('')

      toast({
        title: "Prescription saved",
        description: "The prescription has been successfully saved"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save prescription",
        variant: "destructive"
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prescriptions</CardTitle>
        <CardDescription>
          {me.role === 'doctor' 
            ? `Manage prescriptions for ${patientName}`
            : 'View your current prescriptions'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id} className="mb-4">
              <CardContent className="pt-4">
                <div className="grid gap-4">
                  <div>
                    <p className="text-sm font-medium">Issued by Dr. {prescription.doctorName}</p>
                    <p className="text-sm text-muted-foreground">
                      Issued: {new Date(prescription.issuedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Medications</h4>
                    {prescription.medications.map((med, index) => (
                      <div key={index} className="pl-4 mb-2 border-l-2">
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {med.dosage} - {med.frequency} for {med.duration}
                        </p>
                      </div>
                    ))}
                  </div>
                  {prescription.instructions && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Instructions</h4>
                      <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Next refill: {new Date(prescription.nextRefillDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {me.role === 'doctor' && (
            <>
              {isEditing ? (
                <Card className="mt-4">
                  <CardContent className="pt-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Medication Name</Label>
                        <Input
                          value={newMedication.name}
                          onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter medication name"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="grid gap-2">
                          <Label>Dosage</Label>
                          <Input
                            value={newMedication.dosage}
                            onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                            placeholder="e.g., 500mg"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Frequency</Label>
                          <Input
                            value={newMedication.frequency}
                            onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                            placeholder="e.g., twice daily"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Duration</Label>
                          <Input
                            value={newMedication.duration}
                            onChange={(e) => setNewMedication(prev => ({ ...prev, duration: e.target.value }))}
                            placeholder="e.g., 7 days"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Instructions</Label>
                        <Textarea
                          value={newInstructions}
                          onChange={(e) => setNewInstructions(e.target.value)}
                          placeholder="Additional instructions or notes"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Next Refill Date</Label>
                        <Input
                          type="date"
                          value={nextRefillDate}
                          onChange={(e) => setNextRefillDate(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSave}>Save Prescription</Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button 
                  className="mt-4 w-full" 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                >
                  Add New Prescription
                </Button>
              )}
            </>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}