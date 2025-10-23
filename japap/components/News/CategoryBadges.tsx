import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { NEWS_CATEGORIES, type NewsCategory } from '@/utils/newsCategories';

interface CategoryBadgesProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryName: string | null) => void;
  visible?: boolean;
}

export default function CategoryBadges({
  selectedCategory,
  onCategoryChange,
  visible = true,
}: CategoryBadgesProps) {
  if (!visible) return null;

  const handleCategoryPress = (category: NewsCategory) => {
    // Si la catégorie est déjà sélectionnée, on désélectionne (filtre "Tout")
    if (selectedCategory === category.name) {
      onCategoryChange(null);
    } else {
      onCategoryChange(category.name);
    }
  };

  const renderBadge = ({ item }: { item: NewsCategory }) => {
    const isSelected = selectedCategory === item.name;

    return (
      <TouchableOpacity
        style={[
          styles.badge,
          isSelected
            ? {
                backgroundColor: item.color,
                borderColor: item.color,
              }
            : {
                backgroundColor: '#fff',
                borderColor: item.color,
              },
        ]}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.badgeText,
            isSelected
              ? styles.badgeTextSelected
              : { color: item.color },
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={NEWS_CATEGORIES}
        renderItem={renderBadge}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  separator: {
    width: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Lato',
  },
  badgeTextSelected: {
    color: '#fff',
  },
});
