"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import type { User } from "@/lib/types"

interface ProfileProps {
  user: User
  onUpdate?: (updatedUser: User) => void
}

export default function Profile({ user, onUpdate }: ProfileProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  
  // Initialize formData from localStorage or user prop
  const [formData, setFormData] = useState(() => {
    if (typeof window === 'undefined') return {
      name: user.name,
      email: user.email,
      age: user.age || '',
      gender: user.gender || '',
      height: user.height || '',
      weight: user.weight || '',
      bloodPressure: user.bloodPressure || '',
      heartRate: user.heartRate || '',
      temperature: user.temperature || '',
      respiratoryRate: user.respiratoryRate || '',
      bmi: user.bmi || '',
      bodyFat: user.bodyFat || '',
      muscleMass: user.muscleMass || '',
      boneDensity: user.boneDensity || ''
    }

    const savedData = localStorage.getItem(`medchain_profile_${user.id}`)
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      return {
        ...parsedData,
        // Always use current name and email from user prop
        name: user.name,
        email: user.email,
      }
    }

    return {
      name: user.name,
      email: user.email,
      age: user.age || '',
      gender: user.gender || '',
      height: user.height || '',
      weight: user.weight || '',
      bloodPressure: user.bloodPressure || '',
      heartRate: user.heartRate || '',
      temperature: user.temperature || '',
      respiratoryRate: user.respiratoryRate || '',
      bmi: user.bmi || '',
      bodyFat: user.bodyFat || '',
      muscleMass: user.muscleMass || '',
      boneDensity: user.boneDensity || ''
    }
  })

  // Save to localStorage whenever formData changes
  useEffect(() => {
    if (typeof window !== 'undefined' && user.id) {
      localStorage.setItem(`medchain_profile_${user.id}`, JSON.stringify(formData))
    }
  }, [formData, user.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Save to localStorage
      localStorage.setItem(`medchain_profile_${user.id}`, JSON.stringify(formData))

      // Update user data
      if (onUpdate) {
        onUpdate({ ...user, ...formData })
      }

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      })
      setIsEditing(false)
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    // Revert changes by loading from localStorage
    const savedData = localStorage.getItem(`medchain_profile_${user.id}`)
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      setFormData({
        ...parsedData,
        name: user.name,
        email: user.email,
      })
    } else {
      // If no saved data, revert to user prop values
      setFormData({
        name: user.name,
        email: user.email,
        age: user.age || '',
        gender: user.gender || '',
        height: user.height || '',
        weight: user.weight || '',
        bloodPressure: user.bloodPressure || '',
        heartRate: user.heartRate || '',
        temperature: user.temperature || '',
        respiratoryRate: user.respiratoryRate || '',
        bmi: user.bmi || '',
        bodyFat: user.bodyFat || '',
        muscleMass: user.muscleMass || '',
        boneDensity: user.boneDensity || ''
      })
    }
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </div>
        <div>
          {isEditing ? (
            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" form="profile-form">Save Changes</Button>
            </div>
          ) : (
            <Button type="button" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form id="profile-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  value={formData.gender}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Vital Signs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Blood Pressure (mmHg)</Label>
                <Input
                  id="bloodPressure"
                  value={formData.bloodPressure}
                  placeholder="120/80"
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <Input
                  id="heartRate"
                  type="number"
                  value={formData.heartRate}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="respiratoryRate">Respiratory Rate (breaths/min)</Label>
                <Input
                  id="respiratoryRate"
                  type="number"
                  value={formData.respiratoryRate}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Body Composition */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Body Composition</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bmi">BMI</Label>
                <Input
                  id="bmi"
                  type="number"
                  step="0.1"
                  value={formData.bmi}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, bmi: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFat">Body Fat (%)</Label>
                <Input
                  id="bodyFat"
                  type="number"
                  step="0.1"
                  value={formData.bodyFat}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="muscleMass">Muscle Mass (%)</Label>
                <Input
                  id="muscleMass"
                  type="number"
                  step="0.1"
                  value={formData.muscleMass}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, muscleMass: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boneDensity">Bone Density (g/cm²)</Label>
                <Input
                  id="boneDensity"
                  type="number"
                  step="0.01"
                  value={formData.boneDensity}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, boneDensity: e.target.value })}
                />
              </div>
            </div>
          </div>

        </form>
      </CardContent>
    </Card>
  )
}