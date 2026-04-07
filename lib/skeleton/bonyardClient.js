"use client";

export const defaultSnapshotConfig = {
    excludeSelectors: ["[data-no-skeleton]", "svg"],
    excludeTags: ["nav", "footer"],
};

export const getBoneyardProps = ({
    name,
    loading,
    className,
    color = "rgba(15, 23, 42, 0.08)",
    darkColor = "rgba(255, 255, 255, 0.08)",
    animate = "shimmer",
    snapshotConfig = defaultSnapshotConfig,
}) => ({
    name,
    loading,
    className,
    color,
    darkColor,
    animate,
    snapshotConfig,
});
