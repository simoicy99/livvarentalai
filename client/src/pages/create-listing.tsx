import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { insertListingSchema, type InsertListing } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, X, Upload, Image as ImageIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { uploadMultipleImages } from "@/lib/uploadImage";

export default function CreateListing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [amenities, setAmenities] = useState<string[]>([]);
  const [currentAmenity, setCurrentAmenity] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<InsertListing>({
    resolver: zodResolver(insertListingSchema),
    defaultValues: {
      landlordId: user?.id || "",
      title: "",
      description: "",
      propertyType: "apartment",
      address: "",
      city: "",
      state: "",
      country: "US",
      zipCode: "",
      price: 0,
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: undefined,
      amenities: [],
      images: [],
      available: true,
      agentActive: true,
    },
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: InsertListing) => {
      const response = await apiRequest("POST", "/api/listings", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Listing created",
        description: "Your listing has been posted successfully",
      });
      setLocation("/listings");
    },
    onError: (error) => {
      toast({
        title: "Failed to create listing",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    try {
      const urls = await uploadMultipleImages(e.target.files);
      setUploadedImages([...uploadedImages, ...urls]);
      toast({
        title: "Images uploaded",
        description: `${urls.length} image(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (imageUrl: string) => {
    setUploadedImages(uploadedImages.filter((url) => url !== imageUrl));
  };

  const onSubmit = (data: InsertListing) => {
    createListingMutation.mutate({
      ...data,
      landlordId: user?.id || "",
      amenities,
      images: uploadedImages,
    });
  };

  const addAmenity = () => {
    if (currentAmenity.trim() && !amenities.includes(currentAmenity.trim())) {
      setAmenities([...amenities, currentAmenity.trim()]);
      setCurrentAmenity("");
    }
  };

  const removeAmenity = (amenity: string) => {
    setAmenities(amenities.filter((a) => a !== amenity));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/listings">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Listing</h1>
          <p className="text-muted-foreground mt-1">
            Add a new property to your rental portfolio
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Listing Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Modern 2BR Apartment in Downtown"
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your property, its features, and what makes it special..."
                        className="min-h-32"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-property-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="room">Room</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco" {...field} data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="CA" {...field} value={field.value || ""} data-testid="input-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="94102" {...field} value={field.value || ""} data-testid="input-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rent ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2500"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-bedrooms"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathrooms</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-bathrooms"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="squareFeet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Square Feet</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1000"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-sqft"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel>Amenities</FormLabel>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add amenity (e.g., Parking, Pool)"
                    value={currentAmenity}
                    onChange={(e) => setCurrentAmenity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addAmenity();
                      }
                    }}
                    data-testid="input-amenity"
                  />
                  <Button type="button" onClick={addAmenity} data-testid="button-add-amenity">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="gap-1">
                        {amenity}
                        <button
                          type="button"
                          onClick={() => removeAmenity(amenity)}
                          className="hover-elevate rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FormLabel>Upload Property Images</FormLabel>
                <div className="mt-2">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-md p-8 hover-elevate active-elevate-2 flex flex-col items-center justify-center gap-3">
                      {isUploading ? (
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-muted-foreground" />
                          <div className="text-center">
                            <p className="font-medium">Click to upload images</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              PNG, JPG up to 10MB each
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    data-testid="input-images"
                  />
                </div>
              </div>

              {uploadedImages.length > 0 && (
                <div>
                  <FormLabel className="mb-2 block">Uploaded Images ({uploadedImages.length})</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={imageUrl} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Property ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(imageUrl)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover-elevate opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                          <Badge className="absolute bottom-2 left-2" variant="secondary">
                            Cover
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Link href="/listings">
              <Button type="button" variant="outline" data-testid="button-cancel">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createListingMutation.isPending || isUploading}
              data-testid="button-submit"
            >
              {createListingMutation.isPending ? "Creating..." : "Create Listing"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
