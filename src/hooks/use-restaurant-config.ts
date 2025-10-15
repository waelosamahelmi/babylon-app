import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, handleSupabaseError, formatSupabaseResponse } from "@/lib/supabase-client";
import { useSupabaseAuth } from "@/lib/supabase-auth-context";
import { RestaurantConfig, InsertRestaurantConfig } from "../../shared/schema";

// Get active restaurant config
export function useRestaurantConfig() {
  const { user } = useSupabaseAuth();
  
  return useQuery({
    queryKey: ["restaurant-config"],
    queryFn: async () => {
      console.log('🏪 Fetching restaurant config from Supabase...');
      
      const { data, error } = await supabase
        .from('restaurant_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ Failed to fetch restaurant config:', error);
        // Return null if no active config exists
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        handleSupabaseError(error);
      }

      console.log('✅ Restaurant config fetched successfully');
      return formatSupabaseResponse(data) as RestaurantConfig;
    },
    enabled: !!user,
  });
}

// Get all restaurant configs (for management)
export function useAllRestaurantConfigs() {
  const { user } = useSupabaseAuth();
  
  return useQuery({
    queryKey: ["restaurant-configs-all"],
    queryFn: async () => {
      console.log('🏪 Fetching all restaurant configs from Supabase...');
      
      const { data, error } = await supabase
        .from('restaurant_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch restaurant configs:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Restaurant configs fetched successfully');
      return formatSupabaseResponse(data) as RestaurantConfig[];
    },
    enabled: !!user,
  });
}

// Create restaurant config
export function useCreateRestaurantConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configData: InsertRestaurantConfig) => {
      console.log('🏪 Creating restaurant config...', configData);

      const { data, error } = await supabase
        .from('restaurant_config')
        .insert(configData)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create restaurant config:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Restaurant config created successfully');
      return formatSupabaseResponse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-config"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-configs-all"] });
    },
  });
}

// Update restaurant config
export function useUpdateRestaurantConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...configData }: { id: string } & Partial<InsertRestaurantConfig>) => {
      console.log('🏪 Updating restaurant config...', { id, configData });

      const { data, error } = await supabase
        .from('restaurant_config')
        .update(configData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update restaurant config:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Restaurant config updated successfully');
      return formatSupabaseResponse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-config"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-configs-all"] });
    },
  });
}

// Delete restaurant config
export function useDeleteRestaurantConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🏪 Deleting restaurant config...', id);

      const { error } = await supabase
        .from('restaurant_config')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Failed to delete restaurant config:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Restaurant config deleted successfully');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-config"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-configs-all"] });
    },
  });
}

// Activate restaurant config (deactivates all others)
export function useActivateRestaurantConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🏪 Activating restaurant config...', id);

      // First, deactivate all configs
      const { error: deactivateError } = await supabase
        .from('restaurant_config')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

      if (deactivateError) {
        console.error('❌ Failed to deactivate restaurant configs:', deactivateError);
        handleSupabaseError(deactivateError);
      }

      // Then activate the selected config
      const { data, error } = await supabase
        .from('restaurant_config')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to activate restaurant config:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Restaurant config activated successfully');
      return formatSupabaseResponse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-config"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-configs-all"] });
    },
  });
}