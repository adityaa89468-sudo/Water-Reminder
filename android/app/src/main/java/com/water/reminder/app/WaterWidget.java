package com.water.reminder.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class WaterWidget extends AppWidgetProvider {

    private static final String ACTION_ADD_WATER = "com.water.reminder.app.ACTION_ADD_WATER";
    private static final String EXTRA_AMOUNT = "com.water.reminder.app.EXTRA_AMOUNT";
    private static final String PREFS_NAME = "CapacitorStorage";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        
        // Capacitor Preferences stores values as strings
        String currentIntakeStr = prefs.getString("current_intake", "0");
        String dailyGoalStr = prefs.getString("daily_goal", "2000");
        
        int currentIntake = 0;
        int dailyGoal = 2000;
        
        try {
            currentIntake = Integer.parseInt(currentIntakeStr);
            dailyGoal = Integer.parseInt(dailyGoalStr);
        } catch (NumberFormatException e) {
            // Fallback to defaults
        }

        // Determine which layout to use based on the widget info
        android.appwidget.AppWidgetProviderInfo info = appWidgetManager.getAppWidgetInfo(appWidgetId);
        int layoutId = R.layout.water_widget;
        if (info != null && info.initialLayout == R.layout.water_widget_large) {
            layoutId = R.layout.water_widget_large;
        }

        RemoteViews views = new RemoteViews(context.getPackageName(), layoutId);
        views.setTextViewText(R.id.widget_progress_text, currentIntake + " / " + dailyGoal + " ml");
        views.setProgressBar(R.id.widget_progress_bar, dailyGoal, currentIntake, false);

        // Add 100ml Intent
        Intent add100Intent = new Intent(context, WaterWidget.class);
        add100Intent.setAction(ACTION_ADD_WATER);
        add100Intent.putExtra(EXTRA_AMOUNT, 100);
        PendingIntent pendingAdd100 = PendingIntent.getBroadcast(context, appWidgetId * 10 + 1, add100Intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_add_100, pendingAdd100);

        // Add 250ml Intent
        Intent add250Intent = new Intent(context, WaterWidget.class);
        add250Intent.setAction(ACTION_ADD_WATER);
        add250Intent.putExtra(EXTRA_AMOUNT, 250);
        PendingIntent pendingAdd250 = PendingIntent.getBroadcast(context, appWidgetId * 10 + 2, add250Intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_add_250, pendingAdd250);

        // Add 500ml Intent (only for large layout)
        if (layoutId == R.layout.water_widget_large) {
            Intent add500Intent = new Intent(context, WaterWidget.class);
            add500Intent.setAction(ACTION_ADD_WATER);
            add500Intent.putExtra(EXTRA_AMOUNT, 500);
            PendingIntent pendingAdd500 = PendingIntent.getBroadcast(context, appWidgetId * 10 + 3, add500Intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.btn_add_500, pendingAdd500);
        }

        // Open App Intent
        Intent openAppIntent = new Intent(context, MainActivity.class);
        PendingIntent pendingOpenApp = PendingIntent.getActivity(context, 0, openAppIntent, PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.header, pendingOpenApp);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_ADD_WATER.equals(intent.getAction())) {
            int amount = intent.getIntExtra(EXTRA_AMOUNT, 0);
            if (amount > 0) {
                SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String currentIntakeStr = prefs.getString("current_intake", "0");
                int currentIntake = 0;
                try {
                    currentIntake = Integer.parseInt(currentIntakeStr);
                } catch (NumberFormatException e) {}
                
                currentIntake += amount;
                
                // Save back to Capacitor Preferences format
                prefs.edit().putString("current_intake", String.valueOf(currentIntake)).apply();
                
                // Update all widgets
                AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
                
                int[] smallIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, WaterWidget.class));
                for (int id : smallIds) {
                    updateAppWidget(context, appWidgetManager, id);
                }

                int[] largeIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, WaterWidgetLarge.class));
                for (int id : largeIds) {
                    updateAppWidget(context, appWidgetManager, id);
                }
            }
        }
    }
}
