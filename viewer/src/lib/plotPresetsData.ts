// Auto-generated from UAVLogViewer mavgraphs*.xml — do not edit by hand
import type { PlotPresetGraph } from "./plotPresets";

export const PLOT_PRESET_GRAPHS: PlotPresetGraph[] = [
  {
    "path": "Speed/Ground vs Air Speed",
    "alternatives": [
      "VFR_HUD.groundspeed VFR_HUD.airspeed",
      "GPS[0].Spd GPS[1].Spd CTUN.As ARSP.Airspeed",
      "GPS.Spd CTUN.As ARSP.Airspeed",
      "GPS.Spd ARSP.Airspeed"
    ]
  },
  {
    "path": "Speed/Ground vs Corrected AirSpeed",
    "alternatives": [
      "GPS[0].Spd GPS[1].Spd CTUN.As*CTUN.E2T",
      "GPS.Spd CTUN.As*CTUN.E2T"
    ]
  },
  {
    "path": "Speed/Ground Speed",
    "alternatives": [
      "VFR_HUD.groundspeed",
      "GPS.Spd"
    ]
  },
  {
    "path": "Attitude/Roll and Pitch",
    "alternatives": [
      "degrees(ATTITUDE.roll) degrees(ATTITUDE.pitch)",
      "ATT.Roll ATT.Pitch"
    ]
  },
  {
    "path": "Attitude/RP Comparison",
    "alternatives": [
      "degrees(ATTITUDE.roll) degrees(ATTITUDE.pitch) degrees(AHRS2.roll) degrees(AHRS2.pitch)",
      "ATT.Roll ATT.Pitch AHR2.Roll AHR2.Pitch"
    ]
  },
  {
    "path": "Attitude/Attitude Control",
    "alternatives": [
      "NAV_CONTROLLER_OUTPUT.nav_roll NAV_CONTROLLER_OUTPUT.nav_pitch degrees(ATTITUDE.roll) degrees(ATTITUDE.pitch)",
      "ATT.DesRoll ATT.Roll ATT.DesPitch ATT.Pitch",
      "CTUN.NavRoll CTUN.Roll CTUN.NavPitch CTUN.Pitch"
    ]
  },
  {
    "path": "Attitude/Circular Angle",
    "alternatives": [
      "sqrt(ATT.Roll*ATT.Roll+ATT.Pitch*ATT.Pitch)",
      "sqrt(CTUN.Roll*CTUN.Roll+CTUN.Pitch*CTUN.Pitch)",
      "degrees(sqrt(ATTITUDE.roll*ATTITUDE.roll+ATTITUDE.pitch*ATTITUDE.Pitch))"
    ]
  },
  {
    "path": "Sensors/Accelerometer/Accelerometers",
    "alternatives": [
      "RAW_IMU.xacc*9.81*0.001 RAW_IMU.yacc*9.81*0.001 RAW_IMU.zacc*9.81*0.001 gravity(RAW_IMU)",
      "IMU[0].AccX IMU[0].AccY IMU[0].AccZ sqrt(IMU[0].AccX**2+IMU[0].AccY**2+IMU[0].AccZ**2)",
      "IMU.AccX IMU.AccY IMU.AccZ sqrt(IMU.AccX**2+IMU.AccY**2+IMU.AccZ**2)"
    ]
  },
  {
    "path": "Sensors/Accelerometer/Accelerometer(2)",
    "alternatives": [
      "SCALED_IMU2.xacc*9.81*0.001 SCALED_IMU2.yacc*9.81*0.001 SCALED_IMU2.zacc*9.81*0.001",
      "IMU[1].AccX IMU[1].AccY IMU[1].AccZ sqrt(IMU[1].AccX**2+IMU[1].AccY**2+IMU[1].AccZ**2)",
      "IMU2.AccX IMU2.AccY IMU2.AccZ sqrt(IMU2.AccX**2+IMU2.AccY**2+IMU2.AccZ**2)"
    ]
  },
  {
    "path": "Sensors/Accelerometer/Accelerometer(3)",
    "alternatives": [
      "SCALED_IMU3.xacc*9.81*0.001 SCALED_IMU3.yacc*9.81*0.001 SCALED_IMU3.zacc*9.81*0.001",
      "IMU[2].AccX IMU[2].AccY IMU[2].AccZ sqrt(IMU[2].AccX**2+IMU[2].AccY**2+IMU[2].AccZ**2)",
      "IMU3.AccX IMU3.AccY IMU3.AccZ sqrt(IMU3.AccX**2+IMU3.AccY**2+IMU3.AccZ**2)"
    ]
  },
  {
    "path": "Sensors/Accelerometer/Accelerometer Comparison",
    "alternatives": [
      "RAW_IMU.xacc*9.81*0.001 RAW_IMU.yacc*9.81*0.001 RAW_IMU.zacc*9.81*0.001 SCALED_IMU2.xacc*9.81*0.001 SCALED_IMU2.yacc*9.81*0.001 SCALED_IMU2.zacc*9.81*0.001 SCALED_IMU3.xacc*9.81*0.001 SCALED_IMU3.yacc*9.81*0.001 SCALED_IMU3.zacc*9.81*0.001",
      "RAW_IMU.xacc*9.81*0.001 RAW_IMU.yacc*9.81*0.001 RAW_IMU.zacc*9.81*0.001 SCALED_IMU2.xacc*9.81*0.001 SCALED_IMU2.yacc*9.81*0.001 SCALED_IMU2.zacc*9.81*0.001",
      "IMU[0].AccX IMU[0].AccY IMU[0].AccZ IMU[1].AccX IMU[1].AccY IMU[1].AccZ IMU[2].AccX IMU[2].AccY IMU[2].AccZ",
      "IMU[0].AccX IMU[0].AccY IMU[0].AccZ IMU[1].AccX IMU[1].AccY IMU[1].AccZ",
      "IMU.AccX IMU.AccY IMU.AccZ IMU2.AccX IMU2.AccY IMU2.AccZ IMU3.AccX IMU3.AccY IMU3.AccZ",
      "IMU.AccX IMU.AccY IMU.AccZ IMU2.AccX IMU2.AccY IMU2.AccZ"
    ]
  },
  {
    "path": "Sensors/Gyroscope/Gyros",
    "alternatives": [
      "degrees(RAW_IMU.xgyro*0.001) degrees(RAW_IMU.ygyro*0.001) degrees(RAW_IMU.zgyro*0.001)",
      "IMU[0].GyrX IMU[0].GyrY IMU[0].GyrZ",
      "IMU.GyrX IMU.GyrY IMU.GyrZ"
    ]
  },
  {
    "path": "Sensors/Gyroscope/Gyros(2)",
    "alternatives": [
      "degrees(SCALED_IMU2.xgyro*0.001) degrees(SCALED_IMU2.ygyro*0.001) degrees(SCALED_IMU2.zgyro*0.001)",
      "IMU[1].GyrX IMU[1].GyrY IMU[1].GyrZ",
      "IMU2.GyrX IMU2.GyrY IMU2.GyrZ"
    ]
  },
  {
    "path": "Sensors/Gyroscope/Gyros(3)",
    "alternatives": [
      "degrees(SCALED_IMU3.xgyro*0.001) degrees(SCALED_IMU3.ygyro*0.001) degrees(SCALED_IMU3.zgyro*0.001)",
      "IMU[2].GyrX IMU[2].GyrY IMU[2].GyrZ",
      "IMU3.GyrX IMU3.GyrY IMU3.GyrZ"
    ]
  },
  {
    "path": "Sensors/Gyroscope/Gyro Comparison",
    "alternatives": [
      "degrees(RAW_IMU.xgyro*0.001) degrees(RAW_IMU.ygyro*0.001) degrees(RAW_IMU.zgyro*0.001) degrees(SCALED_IMU2.xgyro*0.001) degrees(SCALED_IMU2.ygyro*0.001) degrees(SCALED_IMU2.zgyro*0.001) degrees(SCALED_IMU3.xgyro*0.001) degrees(SCALED_IMU3.ygyro*0.001) degrees(SCALED_IMU3.zgyro*0.001)",
      "degrees(RAW_IMU.xgyro*0.001) degrees(RAW_IMU.ygyro*0.001) degrees(RAW_IMU.zgyro*0.001) degrees(SCALED_IMU2.xgyro*0.001) degrees(SCALED_IMU2.ygyro*0.001) degrees(SCALED_IMU2.zgyro*0.001)",
      "IMU[0].GyrX IMU[0].GyrY IMU[0].GyrZ IMU[1].GyrX IMU[1].GyrY IMU[1].GyrZ IMU[2].GyrX IMU[2].GyrY IMU[2].GyrZ",
      "IMU[0].GyrX IMU[0].GyrY IMU[0].GyrZ IMU[1].GyrX IMU[1].GyrY IMU[1].GyrZ",
      "IMU.GyrX IMU.GyrY IMU.GyrZ IMU2.GyrX IMU2.GyrY IMU2.GyrZ IMU3.GyrX IMU3.GyrY IMU3.GyrZ",
      "IMU.GyrX IMU.GyrY IMU.GyrZ IMU2.GyrX IMU2.GyrY IMU2.GyrZ"
    ]
  },
  {
    "path": "Sensors/Barometer/Barometer",
    "alternatives": [
      "altitude(SCALED_PRESSURE) SCALED_PRESSURE.temperature*0.01:2",
      "BARO[0].Alt BARO[0].Temp:2",
      "BARO.Alt BARO.Temp:2"
    ]
  },
  {
    "path": "Sensors/Barometer/Barometer(2)",
    "alternatives": [
      "altitude(SCALED_PRESSURE2) SCALED_PRESSURE2.temperature*0.01:2",
      "BARO[1].Alt BARO[1].Temp:2",
      "BAR2.Alt BAR2.Temp:2"
    ]
  },
  {
    "path": "Sensors/Barometer/Barometer(3)",
    "alternatives": [
      "altitude(SCALED_PRESSURE3) SCALED_PRESSURE3.temperature*0.01:2",
      "BARO[2].Alt BARO[2].Temp:2",
      "BAR3.Alt BAR3.Temp:2"
    ]
  },
  {
    "path": "Sensors/Barometer/Barometer Comparison",
    "alternatives": [
      "altitude(SCALED_PRESSURE) SCALED_PRESSURE.temperature*0.01:2 altitude(SCALED_PRESSURE2) SCALED_PRESSURE2.temperature*0.01:2 altitude(SCALED_PRESSURE3) SCALED_PRESSURE3.temperature*0.01:2",
      "altitude(SCALED_PRESSURE) SCALED_PRESSURE.temperature*0.01:2 altitude(SCALED_PRESSURE2) SCALED_PRESSURE2.temperature*0.01:2",
      "BARO[0].Alt BARO[0].Temp:2 BARO[1].Alt BARO[1].Temp:2 BARO[2].Alt BARO[2].Temp:2",
      "BARO[0].Alt BARO[0].Temp:2 BARO[1].Alt BARO[1].Temp:2",
      "BARO.Alt BARO.Temp:2 BAR2.Alt BAR2.Temp:2 BAR3.Alt BAR3.Temp:2",
      "BARO.Alt BARO.Temp:2 BAR2.Alt BAR2.Temp:2"
    ]
  },
  {
    "path": "Sensors/Barometer/Barometric Pressure",
    "alternatives": [
      "SCALED_PRESSURE.press_abs",
      "BARO.Press"
    ]
  },
  {
    "path": "Sensors/Compass/Compass",
    "alternatives": [
      "RAW_IMU.xmag RAW_IMU.ymag RAW_IMU.zmag mag_field(RAW_IMU)",
      "MAG[0].MagX MAG[0].MagY MAG[0].MagZ sqrt(MAG[0].MagX**2+MAG[0].MagY**2+MAG[0].MagZ**2)",
      "MAG.MagX MAG.MagY MAG.MagZ sqrt(MAG.MagX**2+MAG.MagY**2+MAG.MagZ**2)"
    ]
  },
  {
    "path": "Sensors/Compass/Compass(2)",
    "alternatives": [
      "SCALED_IMU2.xmag SCALED_IMU2.ymag SCALED_IMU2.zmag mag_field(SCALED_IMU2)",
      "MAG[1].MagX MAG[1].MagY MAG[1].MagZ sqrt(MAG[1].MagX**2+MAG[1].MagY**2+MAG[1].MagZ**2)",
      "MAG2.MagX MAG2.MagY MAG2.MagZ sqrt(MAG2.MagX**2+MAG2.MagY**2+MAG2.MagZ**2)"
    ]
  },
  {
    "path": "Sensors/Compass/Compass(3)",
    "alternatives": [
      "SCALED_IMU3.xmag SCALED_IMU3.ymag SCALED_IMU3.zmag mag_field(SCALED_IMU3)",
      "MAG[2].MagX MAG[2].MagY MAG[2].MagZ sqrt(MAG[2].MagX**2+MAG[2].MagY**2+MAG[2].MagZ**2)",
      "MAG3.MagX MAG3.MagY MAG3.MagZ sqrt(MAG3.MagX**2+MAG3.MagY**2+MAG3.MagZ**2)"
    ]
  },
  {
    "path": "Sensors/Compass/Compass vs Yaw",
    "alternatives": [
      "mag_heading(RAW_IMU,ATTITUDE) degrees(ATTITUDE.yaw)",
      "mag_heading_df(MAG,ATT) ATT.Yaw"
    ]
  },
  {
    "path": "Servos/Servos 1-4",
    "alternatives": [
      "SERVO_OUTPUT_RAW.servo1_raw SERVO_OUTPUT_RAW.servo2_raw SERVO_OUTPUT_RAW.servo3_raw SERVO_OUTPUT_RAW.servo4_raw",
      "RCOU.Ch1 RCOU.Ch2 RCOU.Ch3 RCOU.Ch4",
      "RCOU.C1 RCOU.C2 RCOU.C3 RCOU.C4"
    ]
  },
  {
    "path": "Servos/Servos 1-8",
    "alternatives": [
      "SERVO_OUTPUT_RAW.servo1_raw SERVO_OUTPUT_RAW.servo2_raw SERVO_OUTPUT_RAW.servo3_raw SERVO_OUTPUT_RAW.servo4_raw SERVO_OUTPUT_RAW.servo5_raw SERVO_OUTPUT_RAW.servo6_raw SERVO_OUTPUT_RAW.servo7_raw SERVO_OUTPUT_RAW.servo8_raw",
      "RCOU.Ch1 RCOU.Ch2 RCOU.Ch3 RCOU.Ch4 RCOU.Ch5 RCOU.Ch6 RCOU.Ch7 RCOU.Ch8",
      "RCOU.C1 RCOU.C2 RCOU.C3 RCOU.C4 RCOU.C5 RCOU.C6 RCOU.C7 RCOU.C8"
    ]
  },
  {
    "path": "RC/RC Input 1-4",
    "alternatives": [
      "RC_CHANNELS.chan1_raw RC_CHANNELS.chan2_raw RC_CHANNELS.chan3_raw RC_CHANNELS.chan4_raw",
      "RC_CHANNELS_RAW.chan1_raw RC_CHANNELS_RAW.chan2_raw RC_CHANNELS_RAW.chan3_raw RC_CHANNELS_RAW.chan4_raw",
      "RCIN.C1 RCIN.C2 RCIN.C3 RCIN.C4"
    ]
  },
  {
    "path": "RC/RC Input 1-8",
    "alternatives": [
      "RC_CHANNELS.chan1_raw RC_CHANNELS.chan2_raw RC_CHANNELS.chan3_raw RC_CHANNELS.chan4_raw RC_CHANNELS.chan5_raw RC_CHANNELS.chan6_raw RC_CHANNELS.chan7_raw RC_CHANNELS.chan8_raw",
      "RC_CHANNELS_RAW.chan1_raw RC_CHANNELS_RAW.chan2_raw RC_CHANNELS_RAW.chan3_raw RC_CHANNELS_RAW.chan4_raw RC_CHANNELS_RAW.chan5_raw RC_CHANNELS_RAW.chan6_raw RC_CHANNELS_RAW.chan7_raw RC_CHANNELS_RAW.chan8_raw",
      "RCIN.C1 RCIN.C2 RCIN.C3 RCIN.C4 RCIN.C5 RCIN.C6 RCIN.C7 RCIN.C8"
    ]
  },
  {
    "path": "Sensors/Lidar/Rangefinder vs Baro",
    "alternatives": [
      "BARO.Alt RFND.Dist1 RFND.Dist2"
    ]
  },
  {
    "path": "Plane/PID Tuning/Pitch Controller",
    "alternatives": [
      "PIDP.Des PIDP.P PIDP.I PIDP.D lowpass(degrees(IMU.GyrY),\"gy\",0.9)"
    ]
  },
  {
    "path": "Plane/PID Tuning/Roll Controller",
    "alternatives": [
      "PIDR.Des PIDR.P PIDR.I PIDR.D lowpass(degrees(IMU.GyrX),\"gx\",0.9)"
    ]
  },
  {
    "path": "Sensors/Compass/Compare Predicted",
    "alternatives": [
      "MAG[0].MagX expected_mag(GPS,ATT).x MAG[0].MagY expected_mag(GPS,ATT).y MAG[0].MagZ expected_mag(GPS,ATT).z",
      "MAG.MagX expected_mag(GPS,ATT).x MAG.MagY expected_mag(GPS,ATT).y MAG.MagZ expected_mag(GPS,ATT).z",
      "RAW_IMU.xmag expected_mag(GPS_RAW_INT,ATTITUDE).x RAW_IMU.ymag expected_mag(GPS_RAW_INT,ATTITUDE).y RAW_IMU.zmag expected_mag(GPS_RAW_INT,ATTITUDE).z"
    ]
  },
  {
    "path": "Sensors/Compass/Compare Predicted2",
    "alternatives": [
      "MAG[1].MagX expected_mag(GPS,ATT).x MAG[1].MagY expected_mag(GPS,ATT).y MAG[1].MagZ expected_mag(GPS,ATT).z",
      "MAG2.MagX expected_mag(GPS,ATT).x MAG2.MagY expected_mag(GPS,ATT).y MAG2.MagZ expected_mag(GPS,ATT).z",
      "SCALED_IMU2.xmag expected_mag(GPS_RAW_INT,ATTITUDE).x SCALED_IMU2.ymag expected_mag(GPS_RAW_INT,ATTITUDE).y SCALED_IMU2.zmag expected_mag(GPS_RAW_INT,ATTITUDE).z"
    ]
  },
  {
    "path": "Sensors/Compass/Compare Predicted3",
    "alternatives": [
      "MAG[2].MagX expected_mag(GPS,ATT).x MAG[2].MagY expected_mag(GPS,ATT).y MAG[2].MagZ expected_mag(GPS,ATT).z",
      "MAG3.MagX expected_mag(GPS,ATT).x MAG3.MagY expected_mag(GPS,ATT).y MAG3.MagZ expected_mag(GPS,ATT).z",
      "SCALED_IMU3.xmag expected_mag(GPS_RAW_INT,ATTITUDE).x SCALED_IMU3.ymag expected_mag(GPS_RAW_INT,ATTITUDE).y SCALED_IMU3.zmag expected_mag(GPS_RAW_INT,ATTITUDE).z"
    ]
  },
  {
    "path": "Sensors/Compass/Compare Predicted Yaw",
    "alternatives": [
      "MAG[0].MagX expected_mag_yaw(GPS,ATT,MAG[0]).x MAG[0].MagY expected_mag_yaw(GPS,ATT,MAG[0]).y MAG[0].MagZ expected_mag_yaw(GPS,ATT,MAG[0]).z",
      "MAG.MagX expected_mag_yaw(GPS,ATT,MAG).x MAG.MagY expected_mag_yaw(GPS,ATT,MAG).y MAG.MagZ expected_mag_yaw(GPS,ATT,MAG).z"
    ]
  },
  {
    "path": "Sensors/Compass/Compare Predicted2 Yaw",
    "alternatives": [
      "MAG[1].MagX expected_mag_yaw(GPS,ATT,MAG[1]).x MAG[1].MagY expected_mag_yaw(GPS,ATT,MAG[1]).y MAG[1].MagZ expected_mag_yaw(GPS,ATT,MAG[1]).z",
      "MAG2.MagX expected_mag_yaw(GPS,ATT,MAG2).x MAG2.MagY expected_mag_yaw(GPS,ATT,MAG2).y MAG2.MagZ expected_mag_yaw(GPS,ATT,MAG2).z"
    ]
  },
  {
    "path": "Sensors/Compass/Compare Predicted3 Yaw",
    "alternatives": [
      "MAG[2].MagX expected_mag_yaw(GPS,ATT,MAG[2]).x MAG[2].MagY expected_mag_yaw(GPS,ATT,MAG[2]).y MAG[2].MagZ expected_mag_yaw(GPS,ATT,MAG[2]).z",
      "MAG3.MagX expected_mag_yaw(GPS,ATT,MAG3).x MAG3.MagY expected_mag_yaw(GPS,ATT,MAG3).y MAG3.MagZ expected_mag_yaw(GPS,ATT,MAG3).z"
    ]
  },
  {
    "path": "Sensors/Compass/Compare Predicted Yaw NKF1",
    "alternatives": [
      "MAG[0].MagX expected_mag_yaw(GPS,NKF1,MAG[0]).x MAG[0].MagY expected_mag_yaw(GPS,NKF1,MAG[0]).y MAG[0].MagZ expected_mag_yaw(GPS,NKF1,MAG[0]).z",
      "MAG.MagX expected_mag_yaw(GPS,NKF1,MAG).x MAG.MagY expected_mag_yaw(GPS,NKF1,MAG).y MAG.MagZ expected_mag_yaw(GPS,NKF1,MAG).z"
    ]
  },
  {
    "path": "Sensors/Compass/Compare Predicted2 Yaw NKF1",
    "alternatives": [
      "MAG[1].MagX expected_mag_yaw(GPS,NKF1,MAG[1]).x MAG[1].MagY expected_mag_yaw(GPS,NKF1,MAG[1]).y MAG[1].MagZ expected_mag_yaw(GPS,NKF1,MAG[1]).z",
      "MAG2.MagX expected_mag_yaw(GPS,NKF1,MAG2).x MAG2.MagY expected_mag_yaw(GPS,NKF1,MAG2).y MAG2.MagZ expected_mag_yaw(GPS,NKF1,MAG2).z"
    ]
  },
  {
    "path": "Sensors/Compass/Compare Predicted3 Yaw NKF1",
    "alternatives": [
      "MAG[2].MagX expected_mag_yaw(GPS,NKF1,MAG[2]).x MAG[2].MagY expected_mag_yaw(GPS,NKF1,MAG[2]).y MAG[2].MagZ expected_mag_yaw(GPS,NKF1,MAG[2]).z",
      "MAG3.MagX expected_mag_yaw(GPS,NKF1,MAG3).x MAG3.MagY expected_mag_yaw(GPS,NKF1,MAG3).y MAG3.MagZ expected_mag_yaw(GPS,NKF1,MAG3).z"
    ]
  },
  {
    "path": "Sensors/Compass/Compare Predicted Yaw XKF1",
    "alternatives": [
      "MAG[0].MagX expected_mag_yaw(GPS,XKF1,MAG[0]).x MAG[0].MagY expected_mag_yaw(GPS,XKF1,MAG[0]).y MAG[0].MagZ expected_mag_yaw(GPS,XKF1,MAG[0]).z",
      "MAG.MagX expected_mag_yaw(GPS,XKF1,MAG).x MAG.MagY expected_mag_yaw(GPS,XKF1,MAG).y MAG.MagZ expected_mag_yaw(GPS,XKF1,MAG).z"
    ]
  },
  {
    "path": "Sensors/Compass/Compare Predicted2 Yaw XKF1",
    "alternatives": [
      "MAG[1].MagX expected_mag_yaw(GPS,XKF1,MAG[1]).x MAG[1].MagY expected_mag_yaw(GPS,XKF1,MAG[1]).y MAG[1].MagZ expected_mag_yaw(GPS,XKF1,MAG[1]).z",
      "MAG2.MagX expected_mag_yaw(GPS,XKF1,MAG2).x MAG2.MagY expected_mag_yaw(GPS,XKF1,MAG2).y MAG2.MagZ expected_mag_yaw(GPS,XKF1,MAG2).z"
    ]
  },
  {
    "path": "Sensors/Compass/Compare Predicted3 Yaw XKF1",
    "alternatives": [
      "MAG[2].MagX expected_mag_yaw(GPS,XKF1,MAG[2]).x MAG[2].MagY expected_mag_yaw(GPS,XKF1,MAG[2]).y MAG[2].MagZ expected_mag_yaw(GPS,XKF1,MAG[2]).z",
      "MAG3.MagX expected_mag_yaw(GPS,XKF1,MAG3).x MAG3.MagY expected_mag_yaw(GPS,XKF1,MAG3).y MAG3.MagZ expected_mag_yaw(GPS,XKF1,MAG3).z"
    ]
  },
  {
    "path": "Sensors/Compass/EarthField Error EK2 Lane1",
    "alternatives": [
      "earth_field_error(GPS,NKF2[0]).x earth_field_error(GPS,NKF2[0]).y earth_field_error(GPS,NKF2[0]).z",
      "earth_field_error(GPS,NKF2).x earth_field_error(GPS,NKF2).y earth_field_error(GPS,NKF2).z"
    ]
  },
  {
    "path": "Sensors/Compass/EarthField Error EK2 Lane2",
    "alternatives": [
      "earth_field_error(GPS,NKF2[1]).x earth_field_error(GPS,NKF2[1]).y earth_field_error(GPS,NKF2[1]).z",
      "earth_field_error(GPS,NKF7).x earth_field_error(GPS,NKF7).y earth_field_error(GPS,NKF7).z"
    ]
  },
  {
    "path": "Sensors/Compass/EarthField Error EK3 Lane1",
    "alternatives": [
      "earth_field_error(GPS,XKF2[0]).x earth_field_error(GPS,XKF2[0]).y earth_field_error(GPS,XKF2[0]).z",
      "earth_field_error(GPS,XKF2).x earth_field_error(GPS,XKF2).y earth_field_error(GPS,XKF2).z"
    ]
  },
  {
    "path": "Sensors/Compass/EarthField Error EK3 Lane2",
    "alternatives": [
      "earth_field_error(GPS,XKF2[1]).x earth_field_error(GPS,XKF2[1]).y earth_field_error(GPS,XKF2[1]).z",
      "earth_field_error(GPS,XKF7).x earth_field_error(GPS,XKF7).y earth_field_error(GPS,XKF7).z"
    ]
  },
  {
    "path": "Copter/PID/PIDP",
    "alternatives": [
      "PIDP.P PIDP.I PIDP.D"
    ]
  },
  {
    "path": "Copter/PID/PIDR",
    "alternatives": [
      "PIDR.P PIDR.I PIDR.D"
    ]
  },
  {
    "path": "Copter/PID/PIDY",
    "alternatives": [
      "PIDY.P PIDY.I PIDY.D"
    ]
  },
  {
    "path": "Copter/PID/PIDA",
    "alternatives": [
      "PIDA.P PIDA.I PIDA.D"
    ]
  },
  {
    "path": "SITL/SIM RollRate vs GyrX",
    "alternatives": [
      "IMU[0].GyrX sim_body_rates(SIM).x",
      "IMU.GyrX sim_body_rates(SIM).x"
    ]
  },
  {
    "path": "SITL/SIM PitchRate vs GyrY",
    "alternatives": [
      "IMU[0].GyrY sim_body_rates(SIM).y",
      "IMU.GyrY sim_body_rates(SIM).y"
    ]
  },
  {
    "path": "SITL/SIM YawRate vs GyrZ",
    "alternatives": [
      "IMU[0].GyrZ sim_body_rates(SIM).z",
      "IMU.GyrZ sim_body_rates(SIM).z"
    ]
  },
  {
    "path": "Sensors/GPS/GPS Accuracy",
    "alternatives": [
      "GPA[0].HAcc GPA[0].SAcc GPA[0].VAcc GPS[0].NSats:2",
      "GPA.HAcc GPA.SAcc GPA.VAcc GPS.NSats:2"
    ]
  },
  {
    "path": "Sensors/GPS/GPS2 Accuracy",
    "alternatives": [
      "GPA[1].HAcc GPA[1].SAcc GPA[1].VAcc GPS[1].NSats:2",
      "GPA2.HAcc GPA2.SAcc GPA2.VAcc GPS2.NSats:2"
    ]
  },
  {
    "path": "Sensors/GPS/RTKPosAltDiff",
    "alternatives": [
      "distance_two(GPS,GPS2){GPS2.GMS==GPS.GMS} GPS2.Alt-GPS.Alt{GPS2.GMS==GPS.GMS}"
    ]
  },
  {
    "path": "EKF3/GSF Yaws Lane1",
    "alternatives": [
      "degrees(XKY0[0].Y0) degrees(XKY0[0].Y1) degrees(XKY0[0].Y2) degrees(XKY0[0].Y3) degrees(XKY0[0].Y4) degrees(XKY0[0].YC)"
    ]
  },
  {
    "path": "EKF3/GSF Yaws Lane2",
    "alternatives": [
      "degrees(XKY0[1].Y0) degrees(XKY0[1].Y1) degrees(XKY0[1].Y2) degrees(XKY0[1].Y3) degrees(XKY0[1].Y4) degrees(XKY0[1].YC)"
    ]
  },
  {
    "path": "EKF3/GSF VelInnov Lane1",
    "alternatives": [
      "sqrt(XKY1[0].IVN0**2+XKY1[0].IVE0**2) sqrt(XKY1[0].IVN1**2+XKY1[0].IVE1**2) sqrt(XKY1[0].IVN2**2+XKY1[0].IVE2**2) sqrt(XKY1[0].IVN3**2+XKY1[0].IVE3**2) sqrt(XKY1[0].IVN4**2+XKY1[0].IVE4**2) ATT.Yaw:2"
    ]
  },
  {
    "path": "Replay/EK3 VelNE",
    "alternatives": [
      "XKF1[0].VN-XKF1[100].VN{XKF1.C==100} XKF1[0].VE-XKF1[100].VE{XKF1.C==100}"
    ]
  },
  {
    "path": "Replay/RollPitchDiff",
    "alternatives": [
      "XKF1[0].Pitch-XKF1[100].Pitch{XKF1.C==100} XKF1[0].Roll-XKF1[100].Roll{XKF1.C==100}"
    ]
  },
  {
    "path": "Replay/EK2 RollPitchDiff",
    "alternatives": [
      "NKF1[0].Pitch-NKF1[100].Pitch{NKF1.C==100} NKF1[0].Roll-NKF1[100].Roll{NKF1.C==100} NKF1[0].Yaw-NKF1[100].Yaw{NKF1.C==100}"
    ]
  },
  {
    "path": "Replay/EK3 DiffPNPE",
    "alternatives": [
      "XKF1[0].PN-XKF1[100].PN{XKF1.C==100} XKF1[0].PE-XKF1[100].PE{XKF1.C==100}"
    ]
  },
  {
    "path": "Replay/EK2 DiffPNPE",
    "alternatives": [
      "NKF1[0].PN-NKF1[100].PN{NKF1.C==100} NKF1[0].PE-NKF1[100].PE{NKF1.C==100}"
    ]
  },
  {
    "path": "Replay/EK2 DiffPD",
    "alternatives": [
      "NKF1[0].PD-NKF1[100].PD{NKF1.C==100}"
    ]
  },
  {
    "path": "Replay/EK3 DiffPD",
    "alternatives": [
      "XKF1[0].PD-XKF1[100].PD{XKF1.C==100}"
    ]
  },
  {
    "path": "Aliasing/AccX",
    "alternatives": [
      "lowpass(IMU[0].AccX,0,0.9) lowpass(IMU[1].AccX,1,0.9) lowpass(IMU[2].AccX,2,0.9)",
      "lowpass(IMU[0].AccX,0,0.9) lowpass(IMU[1].AccX,1,0.9)",
      "lowpass(IMU.AccX,0,0.9) lowpass(IMU2.AccX,1,0.9) lowpass(IMU3.AccX,2,0.9)",
      "lowpass(IMU.AccX,0,0.9) lowpass(IMU2.AccX,1,0.9)"
    ]
  },
  {
    "path": "Aliasing/AccY",
    "alternatives": [
      "lowpass(IMU[0].AccY,0,0.9) lowpass(IMU[1].AccY,1,0.9) lowpass(IMU[2].AccY,2,0.9)",
      "lowpass(IMU[0].AccY,0,0.9) lowpass(IMU[1].AccY,1,0.9)",
      "lowpass(IMU.AccY,0,0.9) lowpass(IMU2.AccY,1,0.9) lowpass(IMU3.AccY,2,0.9)",
      "lowpass(IMU.AccY,0,0.9) lowpass(IMU2.AccY,1,0.9)"
    ]
  },
  {
    "path": "Aliasing/AccZ",
    "alternatives": [
      "lowpass(IMU[0].AccZ,0,0.9) lowpass(IMU[1].AccZ,1,0.9) lowpass(IMU[2].AccZ,2,0.9)",
      "lowpass(IMU[0].AccZ,0,0.9) lowpass(IMU[1].AccZ,1,0.9)",
      "lowpass(IMU.AccZ,0,0.9) lowpass(IMU2.AccZ,1,0.9) lowpass(IMU3.AccZ,2,0.9)",
      "lowpass(IMU.AccZ,0,0.9) lowpass(IMU2.AccZ,1,0.9)"
    ]
  },
  {
    "path": "Rover/Steering Tuning",
    "alternatives": [
      "STER.TurnRate STER.DesTurnRate"
    ]
  },
  {
    "path": "Rover/Speed Tuning",
    "alternatives": [
      "THR.Speed THR.DesSpeed"
    ]
  },
  {
    "path": "PSC/PSC Vel",
    "alternatives": [
      "sqrt(PSCN.DVN**2+PSCE.DVE**2) sqrt(PSCN.VN**2+PSCE.VE**2)"
    ]
  },
  {
    "path": "PSC/PSC Vel NE",
    "alternatives": [
      "PSCN.VN PSCN.DVN PSCN.TVN PSCE.VE PSCE.DVE PSCE.TVE"
    ]
  },
  {
    "path": "PSC/PSC Pos NE",
    "alternatives": [
      "PSCN.TPN PSCN.PN PSCE.TPE PSCE.PE"
    ]
  },
  {
    "path": "Sensors/Wheel Encoders",
    "alternatives": [
      "WENC.Dist0 WENC.Dist1"
    ]
  },
  {
    "path": "Sensors/Vision/Visual Position",
    "alternatives": [
      "VISP.PX VISP.PY VISP.PZ"
    ]
  },
  {
    "path": "Sensors/Vision/Visual Velocity",
    "alternatives": [
      "VISV.VX VISV.VY VISV.VZ"
    ]
  },
  {
    "path": "Rover/Speed and Battery",
    "alternatives": [
      "THR.Speed BAT.Curr:2 BAT.Volt:2"
    ]
  },
  {
    "path": "Rover/Speed and Throttle",
    "alternatives": [
      "THR.Speed THR.ThrOut:2"
    ]
  },
  {
    "path": "TECS/Speed Demand vs Speed",
    "alternatives": [
      "TECS.sp TECS.sp_dem"
    ]
  },
  {
    "path": "Sensors/Lidar/Rangefinder vs Baro",
    "alternatives": [
      "RANGEFINDER.distance GLOBAL_POSITION_INT.relative_alt*0.001"
    ]
  },
  {
    "path": "Board/Power",
    "alternatives": [
      "POWER_STATUS.Vcc*0.001 POWER_STATUS.Vservo*0.001"
    ]
  },
  {
    "path": "Sensors/Accelerometer/Vibration",
    "alternatives": [
      "VIBE[0].VibeX VIBE[0].VibeY VIBE[0].VibeZ",
      "VIBE.VibeX VIBE.VibeY VIBE.VibeZ"
    ]
  },
  {
    "path": "Sensors/Accelerometer/Vibration IMU2",
    "alternatives": [
      "VIBE[1].VibeX VIBE[1].VibeY VIBE[1].VibeZ"
    ]
  },
  {
    "path": "Sensors/Accelerometer/Vibration IMU3",
    "alternatives": [
      "VIBE[2].VibeX VIBE[2].VibeY VIBE[2].VibeZ"
    ]
  },
  {
    "path": "Sensors/Accelerometer/Clipping",
    "alternatives": [
      "VIBE[0].Clip VIBE[1].Clip VIBE[2].Clip",
      "VIBE[0].Clip VIBE[1].Clip",
      "VIBE[0].Clip",
      "VIBE.Clip0 VIBE.Clip1 VIBE.Clip2"
    ]
  },
  {
    "path": "Sensors/Lidar/Corrected",
    "alternatives": [
      "BARO.Alt/(cos(radians(ATT.Roll))*cos(radians(ATT.Pitch))) RFND.Dist1"
    ]
  },
  {
    "path": "Sensors/Lidar/Corrected Baro",
    "alternatives": [
      "BARO.Alt/(cos(radians(ATT.Roll))*cos(radians(ATT.Pitch))) RFND.Dist1"
    ]
  },
  {
    "path": "Sensors/Lidar/Corrected Distance",
    "alternatives": [
      "BARO.Alt RFND.Dist1*cos(radians(ATT.Roll))*cos(radians(ATT.Pitch))"
    ]
  },
  {
    "path": "Radio/RSSI_Distance",
    "alternatives": [
      "RADIO_STATUS.rssi RADIO_STATUS.noise RADIO_STATUS.remrssi RADIO_STATUS.remnoise distance_home(GPS_RAW_INT):2"
    ]
  },
  {
    "path": "Servos/Servos 5-8",
    "alternatives": [
      "RCOU.Ch5 RCOU.Ch6 RCOU.Ch7 RCOU.Ch8",
      "RCOU.C5 RCOU.C6 RCOU.C7 RCOU.C8"
    ]
  },
  {
    "path": "Servos/Servos 1-4",
    "alternatives": [
      "RCOU.Ch1 RCOU.Ch2 RCOU.Ch3 RCOU.Ch4",
      "RCOU.C1 RCOU.C2 RCOU.C3 RCOU.C4"
    ]
  },
  {
    "path": "Power/Current and Voltage",
    "alternatives": [
      "SYS_STATUS.voltage_battery*0.001 SYS_STATUS.current_battery*0.01"
    ]
  },
  {
    "path": "Servos/Servos 5-12",
    "alternatives": [
      "RCOU.Ch5 RCOU.Ch6 RCOU.Ch7 RCOU.Ch8 RCOU.Ch9 RCOU.Ch10 RCOU.Ch11 RCOU.Ch12",
      "RCOU.C5 RCOU.C6 RCOU.C7 RCOU.C8 RCOU.C9 RCOU.C10 RCOU.C11 RCOU.C12"
    ]
  },
  {
    "path": "Servos/OctaQuad",
    "alternatives": [
      "RCOU.Ch5 RCOU.Ch6 RCOU.Ch7 RCOU.Ch8 RCOU.Ch9 RCOU.Ch10 RCOU.Ch11 RCOU.Ch12",
      "RCOU.C5 RCOU.C6 RCOU.C7 RCOU.C8 RCOU.C9 RCOU.C10 RCOU.C11 RCOU.C12"
    ]
  },
  {
    "path": "Quadplane/Climb Rate",
    "alternatives": [
      "QTUN.CRt QTUN.DCRt BARO.Alt:2"
    ]
  },
  {
    "path": "Quadplane/Velocity XY",
    "alternatives": [
      "QTUN.DVx QTUN.DVy NKF1[0].VN NKF1[0].VE",
      "QTUN.DVx QTUN.DVy NKF1.VN NKF1.VE"
    ]
  },
  {
    "path": "Quadplane/Leonard",
    "alternatives": [
      "QTUN.DVx QTUN.DVy NKF1[0].VN NKF1[0].VE ATT.DesPitch:2 ATT.Pitch:2",
      "QTUN.DVx QTUN.DVy NKF1.VN NKF1.VE ATT.DesPitch:2 ATT.Pitch:2"
    ]
  },
  {
    "path": "Quadplane/Landing",
    "alternatives": [
      "QTUN.DVx QTUN.DVy NKF1[0].VN NKF1[0].VE ATT.DesPitch ATT.Pitch NTUN.WpDist:2 BARO.Alt:2",
      "QTUN.DVx QTUN.DVy NKF1.VN NKF1.VE ATT.DesPitch ATT.Pitch NTUN.WpDist:2 BARO.Alt:2"
    ]
  },
  {
    "path": "Replay/Roll",
    "alternatives": [
      "SIM.Roll ATT.Roll NKF1.Roll NKF1[1].Roll",
      "SIM.Roll ATT.Roll NKF1.Roll NKF6.Roll EKF1.Roll"
    ]
  },
  {
    "path": "Replay/Pitch",
    "alternatives": [
      "SIM.Pitch ATT.Pitch NKF1[0].Pitch NKF1[1].Pitch",
      "SIM.Pitch ATT.Pitch NKF1.Pitch NKF6.Pitch EKF1.Pitch"
    ]
  },
  {
    "path": "Replay/Yaw",
    "alternatives": [
      "SIM.Yaw ATT.Yaw NKF1[0].Yaw NKF1[1].Yaw",
      "SIM.Yaw ATT.Yaw NKF1.Yaw NKF6.Yaw EKF1.Yaw"
    ]
  },
  {
    "path": "PM/Perf",
    "alternatives": [
      "PM.MaxT PM.NLon:2"
    ]
  },
  {
    "path": "PM/LogDrop",
    "alternatives": [
      "PM.MaxT PM.NLon:2 PM.LogDrop:2"
    ]
  },
  {
    "path": "Copter/Controller RMS",
    "alternatives": [
      "CTRL.RMSRoll CTRL.RMSPitch CTRL.RMSYaw",
      "CTRL.RMSRollP CTRL.RMSRollD CTRL.RMSPitchP CTRL.RMSPitchD CTRL.RMSYaw"
    ]
  },
  {
    "path": "Radio/Projected Distance",
    "alternatives": [
      "lowpass(pow(2,(RADIO_STATUS.rssi-RADIO_STATUS.noise)*0.5/6)*distance_home(GPS_RAW_INT),\"r1\",0.99) lowpass(pow(2,(RADIO_STATUS.remrssi-RADIO_STATUS.remnoise)*0.5/6)*distance_home(GPS_RAW_INT),\"r2\",0.99)"
    ]
  },
  {
    "path": "Rover/Steering",
    "alternatives": [
      "STER.Achieved STER.Demanded"
    ]
  },
  {
    "path": "Servos/OctaQuad-CCW",
    "alternatives": [
      "RCOU.Ch5 RCOU.Ch7 RCOU.Ch9 RCOU.Ch11",
      "RCOU.C5 RCOU.C7 RCOU.C9 RCOU.C11"
    ]
  },
  {
    "path": "Servos/OctaQuad-CW",
    "alternatives": [
      "RCOU.Ch6 RCOU.Ch8 RCOU.Ch10 RCOU.Ch12",
      "RCOU.C6 RCOU.C8 RCOU.C10 RCOU.C12"
    ]
  },
  {
    "path": "Copter/RateOutputs",
    "alternatives": [
      "RATE.ROut RATE.POut RATE.YOut RATE.AOut"
    ]
  },
  {
    "path": "Sensors/Gyroscope/Gyro 1",
    "alternatives": [
      "degrees(IMU[0].GyrX) degrees(IMU[0].GyrY) degrees(IMU[0].GyrZ)",
      "degrees(IMU.GyrX) degrees(IMU.GyrY) degrees(IMU.GyrZ)"
    ]
  },
  {
    "path": "Sensors/Gyroscope/Gyro 2",
    "alternatives": [
      "degrees(IMU[1].GyrX) degrees(IMU[1].GyrY) degrees(IMU[1].GyrZ)",
      "degrees(IMU2.GyrX) degrees(IMU2.GyrY) degrees(IMU2.GyrZ)"
    ]
  },
  {
    "path": "Sensors/Gyroscope/Gyro 3",
    "alternatives": [
      "degrees(IMU[2].GyrX) degrees(IMU[2].GyrY) degrees(IMU[2].GyrZ)",
      "degrees(IMU3.GyrX) degrees(IMU3.GyrY) degrees(IMU3.GyrZ)"
    ]
  },
  {
    "path": "Servos/OctaQuad-FRONT",
    "alternatives": [
      "RCOU.C5 RCOU.C6 RCOU.C9 RCOU.C10"
    ]
  },
  {
    "path": "Servos/OctaQuad-REAR",
    "alternatives": [
      "RCOU.C7 RCOU.C8 RCOU.C11 RCOU.C12"
    ]
  },
  {
    "path": "Servos/OctaQuad-Front-Rear",
    "alternatives": [
      "RCOU.C5+RCOU.C6+RCOU.C9+RCOU.C10 RCOU.C7+RCOU.C8+RCOU.C11+RCOU.C12"
    ]
  },
  {
    "path": "RADIO/RSSI_Distance",
    "alternatives": [
      "RAD.RSSI RAD.Noise RAD.RemRSSI RAD.RemNoise distance_home(GPS):2"
    ]
  },
  {
    "path": "Radio/RSSI_Noise",
    "alternatives": [
      "RAD.RSSI RAD.Noise RAD.RemRSSI RAD.RemNoise"
    ]
  },
  {
    "path": "Flow/FlowAGL vs Terrain",
    "alternatives": [
      "lowpass(max((GPS.Spd/(OF.flowY-OF.bodyY)),0)*cos(radians(ATT.Roll))*cos(radians(ATT.Pitch)),\"flowheight\",0.95) TERR.CHeight"
    ]
  },
  {
    "path": "Servos/TiltTri",
    "alternatives": [
      "RCOU.C5 RCOU.C6 RCOU.C8 RCOU.C11 RCOU.C12"
    ]
  },
  {
    "path": "Flow/FlowHeight",
    "alternatives": [
      "max(min(cos(radians(ATT.Roll))*cos(radians(ATT.Pitch))*GPS.Spd/lowpass(ROF.Fx-ROF.By,\"r\",0.95),100),0) BARO.Alt"
    ]
  },
  {
    "path": "Servos/OctaQuad CCW-CW",
    "alternatives": [
      "(RCOU.C5+RCOU.C7+RCOU.C9+RCOU.C11)/4 (RCOU.C6+RCOU.C8+RCOU.C10+RCOU.C12)/4"
    ]
  },
  {
    "path": "Servos/OctaQuad-CCW-CW",
    "alternatives": [
      "0.25*(SERVO_OUTPUT_RAW.servo5_raw+SERVO_OUTPUT_RAW.servo7_raw+SERVO_OUTPUT_RAW.servo9_raw+SERVO_OUTPUT_RAW.servo11_raw) 0.25*(SERVO_OUTPUT_RAW.servo6_raw+SERVO_OUTPUT_RAW.servo8_raw+SERVO_OUTPUT_RAW.servo10_raw+SERVO_OUTPUT_RAW.servo12_raw)"
    ]
  },
  {
    "path": "Servos/OctaQuad-Front-Back",
    "alternatives": [
      "0.25*(SERVO_OUTPUT_RAW.servo5_raw+SERVO_OUTPUT_RAW.servo6_raw+SERVO_OUTPUT_RAW.servo9_raw+SERVO_OUTPUT_RAW.servo10_raw) 0.25*(SERVO_OUTPUT_RAW.servo7_raw+SERVO_OUTPUT_RAW.servo8_raw+SERVO_OUTPUT_RAW.servo11_raw+SERVO_OUTPUT_RAW.servo12_raw)"
    ]
  },
  {
    "path": "OBC/Link Status",
    "alternatives": [
      "link_up(GPS_RAW_INT,0) link_up(GPS_RAW_INT,1) link_up(GPS_RAW_INT,2) link_up(GPS_RAW_INT,3) GLOBAL_POSITION_INT.relative_alt*0.001:2"
    ]
  },
  {
    "path": "Link/Heartbeat-outages",
    "alternatives": [
      "diff(HEARTBEAT._timestamp,\"t\")"
    ]
  },
  {
    "path": "Link/TimeLag",
    "alternatives": [
      "SYSTEM_TIME._timestamp-SYSTEM_TIME.time_unix_usec*1.0e-6"
    ]
  },
  {
    "path": "ADAP/K1H",
    "alternatives": [
      "ADAP.K1H"
    ]
  },
  {
    "path": "Sensors/Compass Compare 1-2",
    "alternatives": [
      "MAG[0].MagX MAG[0].MagY MAG[0].MagZ MAG[1].MagX MAG[1].MagY MAG[1].MagZ",
      "MAG.MagX MAG.MagY MAG.MagZ MAG2.MagX MAG2.MagY MAG2.MagZ"
    ]
  },
  {
    "path": "Sensors/Wind Speed",
    "alternatives": [
      "sqrt(NKF2[0].VWE**2+NKF2[0].VWN**2)",
      "sqrt(NKF2.VWE**2+NKF2.VWN**2)"
    ]
  },
  {
    "path": "TECS/Height",
    "alternatives": [
      "TECS.h TECS.hdem BARO.Alt"
    ]
  },
  {
    "path": "TECS/Speed",
    "alternatives": [
      "TECS.sp TECS.spdem"
    ]
  },
  {
    "path": "Sensors/GPS Time Jitter",
    "alternatives": [
      "diff(GPS.TimeUS,\"t\")*1.0e-6 diff(GPS.GMS,\"gt\")*1.0e-3"
    ]
  },
  {
    "path": "EKF/PositionInnov1",
    "alternatives": [
      "NKF3[0].IPN NKF3[0].IPE",
      "NKF3.IPN NKF3.IPE"
    ]
  },
  {
    "path": "Copter/PIDR Desired vs Achieved",
    "alternatives": [
      "degrees(PIDR.Des) degrees(IMU.GyrX)"
    ]
  },
  {
    "path": "Vibe/AccZ",
    "alternatives": [
      "ACC1.AccZ IMU.AccZ"
    ]
  },
  {
    "path": "Vibe/AccY",
    "alternatives": [
      "ACC1.AccY IMU.AccY"
    ]
  },
  {
    "path": "Flow/FlowX",
    "alternatives": [
      "OF.flowX OF.bodyX IMU.GyrX"
    ]
  },
  {
    "path": "Flow/FlowY",
    "alternatives": [
      "OF.flowY OF.bodyY IMU.GyrY"
    ]
  },
  {
    "path": "Flow/Velocity vs GPS",
    "alternatives": [
      "sqrt((OF.flowX-OF.bodyX)**2+(OF.flowY-OF.bodyY)**2)*RFND.Dist1*cos(radians(ATT.Roll))*cos(radians(ATT.Pitch)) GPS.Spd BARO.Alt:2"
    ]
  },
  {
    "path": "Sensors/Accelerometer/Vibration",
    "alternatives": [
      "VIBRATION.vibration_x VIBRATION.vibration_y VIBRATION.vibration_z"
    ]
  },
  {
    "path": "EKF/GPS Vel NE",
    "alternatives": [
      "GPS.Spd*sin(radians(GPS.GCrs)) NKF1[0].VE GPS.Spd*cos(radians(GPS.GCrs)) NKF1[0].VN",
      "GPS.Spd*sin(radians(GPS.GCrs)) NKF1.VE GPS.Spd*cos(radians(GPS.GCrs)) NKF1.VN"
    ]
  },
  {
    "path": "Flow/Flow vel vs EKF",
    "alternatives": [
      "NKF1[0].VN NKF1[0].VE flow_vel_ef(OF,RFND,ATT).x flow_vel_ef(OF,RFND,ATT).y",
      "NKF1.VN NKF1.VE flow_vel_ef(OF,RFND,ATT).x flow_vel_ef(OF,RFND,ATT).y"
    ]
  },
  {
    "path": "Flow/GPS vel body",
    "alternatives": [
      "gps_vel_body(GPS,ATT).x (OF.flowY-OF.bodyY)*RFND.Dist1 gps_vel_body(GPS,ATT).y (OF.flowX-OF.bodyX)*RFND.Dist1*-1"
    ]
  },
  {
    "path": "EKF/EKF3 Accel Offsets",
    "alternatives": [
      "XKF2.AX XKF2.AY XKF2.AZ"
    ]
  },
  {
    "path": "Copter/PID Tuning/PIQP",
    "alternatives": [
      "PIQP.FF PIQP.P PIQP.I PIQP.D"
    ]
  },
  {
    "path": "Copter/PID Tuning/PIQR",
    "alternatives": [
      "PIQR.FF PIQR.P PIQR.I PIQR.D"
    ]
  },
  {
    "path": "Copter/PID Tuning/PIQY",
    "alternatives": [
      "PIQY.FF PIQY.P PIQY.I PIQY.D"
    ]
  },
  {
    "path": "Copter/PID Tuning/PIQA",
    "alternatives": [
      "PIQA.P PIQA.I PIQA.D"
    ]
  },
  {
    "path": "Plane/PID Tuning/PIDR",
    "alternatives": [
      "PIDR.FF PIDR.P PIDR.I PIDR.D"
    ]
  },
  {
    "path": "Plane/PID Tuning/PIDP",
    "alternatives": [
      "PIDP.FF PIDP.P PIDP.I PIDP.D"
    ]
  },
  {
    "path": "Plane/PID Tuning/PIDS",
    "alternatives": [
      "PIDS.P PIDS.I PIDS.D"
    ]
  },
  {
    "path": "EKF2/Gyro Bias",
    "alternatives": [
      "NKF1[0].GX NKF1[0].GY NKF1[0].GZ NKF1[1].GX NKF1[1].GY NKF1[1].GZ NKF1[2].GX NKF1[2].GY NKF1[2].GZ",
      "NKF1[0].GX NKF1[0].GY NKF1[0].GZ NKF1[1].GX NKF1[1].GY NKF1[1].GZ",
      "NKF1.GX NKF1.GY NKF1.GZ"
    ]
  },
  {
    "path": "EKF2/Origin Height",
    "alternatives": [
      "NKF1[0].OH NKF1[1].OH NKF1[2].OH",
      "NKF1[0].OH NKF1[1].OH",
      "NKF1.OH"
    ]
  },
  {
    "path": "EKF2/Pos NE",
    "alternatives": [
      "NKF1[0].PN NKF1[1].PN NKF1[2].PN NKF1[0].PE NKF1[1].PE NKF1[2].PE",
      "NKF1[0].PN NKF1[1].PN NKF1[0].PE NKF1[1].PE",
      "NKF1.PN NKF1.PE"
    ]
  },
  {
    "path": "EKF2/Pos D",
    "alternatives": [
      "NKF1[0].PD NKF1[1].PD NKF1[2].PD",
      "NKF1[0].PD NKF1[1].PD",
      "NKF1.PD"
    ]
  },
  {
    "path": "EKF2/Position Innovation NE",
    "alternatives": [
      "NKF3[0].IPN NKF3[1].IPN NKF3[2].IPN NKF3[0].IPE NKF3[1].IPE NKF3[2].IPE",
      "NKF3[0].IPN NKF3[1].IPN NKF3[0].IPE NKF3[1].IPE",
      "NKF3.IPN NKF3.IPE"
    ]
  },
  {
    "path": "EKF2/Position Innovation Down",
    "alternatives": [
      "NKF3[0].IPD NKF3[1].IPD NKF3[2].IPD",
      "NKF3[0].IPD NKF3[1].IPD",
      "NKF3.IPD"
    ]
  },
  {
    "path": "EKF2/Velocity Innovation NE",
    "alternatives": [
      "NKF3[0].IVN NKF3[1].IVN NKF3[2].IVN NKF3[0].IVE NKF3[1].IVE NKF3[2].IVE",
      "NKF3[0].IVN NKF3[1].IVN NKF3[0].IVE NKF3[1].IVE",
      "NKF3.IVN NKF3.IVE"
    ]
  },
  {
    "path": "EKF2/Velocity Innovation Down",
    "alternatives": [
      "NKF3[0].IVD NKF3[1].IVD NKF3[2].IVD",
      "NKF3[0].IVD NKF3[1].IVD",
      "NKF3.IVD"
    ]
  },
  {
    "path": "EKF2/Euler Roll",
    "alternatives": [
      "ATT.Roll NKF1[0].Roll NKF1[1].Roll NKF1[2].Roll",
      "ATT.Roll NKF1[0].Roll NKF1[1].Roll",
      "ATT.Roll NKF1.Roll NKF6.Roll",
      "ATT.Roll NKF1.Roll"
    ]
  },
  {
    "path": "EKF2/Euler Pitch",
    "alternatives": [
      "ATT.Pitch NKF1[0].Pitch NKF1[1].Pitch NKF1[2].Pitch",
      "ATT.Pitch NKF1[0].Pitch NKF1[1].Pitch",
      "ATT.Pitch NKF1.Pitch NKF6.Pitch",
      "ATT.Pitch NKF1.Pitch"
    ]
  },
  {
    "path": "EKF2/Euler Yaw",
    "alternatives": [
      "ATT.Yaw NKF1[0].Yaw NKF1[1].Yaw NKF1[2].Yaw",
      "ATT.Yaw NKF1[0].Yaw NKF1[1].Yaw",
      "ATT.Yaw NKF1.Yaw NKF6.Yaw",
      "ATT.Yaw NKF1.Yaw"
    ]
  },
  {
    "path": "EKF2/Velocity N",
    "alternatives": [
      "NKF1[0].VN NKF1[1].VN NKF1[2].VN",
      "NKF1[0].VN NKF1[1].VN",
      "NKF1.VN"
    ]
  },
  {
    "path": "EKF2/Velocity E",
    "alternatives": [
      "NKF1[0].VE NKF1[1].VE NKF1[2].VE",
      "NKF1[0].VE NKF1[1].VE",
      "NKF1.VE NKF6.VE",
      "NKF1.VE"
    ]
  },
  {
    "path": "EKF2/Velocity D",
    "alternatives": [
      "NKF1[0].VD NKF1[1].VD NKF1[2].VD",
      "NKF1[0].VD NKF1[1].VD",
      "NKF1.VD NKF6.VD",
      "NKF1.VD"
    ]
  },
  {
    "path": "EKF2/Velocity dDP",
    "alternatives": [
      "NKF1[0].dPD NKF1[1].dPD NKF1[2].dPD",
      "NKF1[0].dPD NKF1[1].dPD",
      "NKF1.dPD"
    ]
  },
  {
    "path": "EKF2/AZBias",
    "alternatives": [
      "NKF2[0].AZbias NKF2[1].AZbias NKF2[2].AZbias",
      "NKF2[0].AZbias NKF2[1].AZbias",
      "NKF2.AZbias NKF7.AZbias",
      "NKF2.AZbias"
    ]
  },
  {
    "path": "EKF2/Gyro Scale Factor",
    "alternatives": [
      "NKF2[0].GSX NKF2[0].GSY NKF2[0].GSZ NKF2[1].GSX NKF2[1].GSY NKF2[1].GSZ NKF2[2].GSX NKF2[2].GSY NKF2[2].GSZ",
      "NKF2[0].GSX NKF2[0].GSY NKF2[0].GSZ NKF2[1].GSX NKF2[1].GSY NKF2[1].GSZ",
      "NKF2.GSX NKF2.GSY NKF2.GSZ"
    ]
  },
  {
    "path": "EKF2/Mag Earth Field",
    "alternatives": [
      "NKF2[0].MN NKF2[0].ME NKF2[0].MD NKF2[1].MN NKF2[1].ME NKF2[1].MD NKF2[2].MN NKF2[2].ME NKF2[2].MD",
      "NKF2[0].MN NKF2[0].ME NKF2[0].MD NKF2[1].MN NKF2[1].ME NKF2[1].MD",
      "NKF2.MN NKF2.ME NKF2.MD"
    ]
  },
  {
    "path": "EKF2/Mag Body Field",
    "alternatives": [
      "NKF2[0].MX NKF2[0].MY NKF2[0].MZ NKF2[1].MX NKF2[1].MY NKF2[1].MZ NKF2[2].MX NKF2[2].MY NKF2[2].MZ",
      "NKF2[0].MX NKF2[0].MY NKF2[0].MZ NKF2[1].MX NKF2[1].MY NKF2[1].MZ",
      "NKF2.MX NKF2.MY NKF2.MZ"
    ]
  },
  {
    "path": "EKF2/Wind NE",
    "alternatives": [
      "NKF2[0].VWN NKF2[0].VWE NKF2[1].VWN NKF2[1].VWE NKF2[2].VWN NKF2[2].VWE",
      "NKF2[0].VWN NKF2[0].VWE NKF2[1].VWN NKF2[1].VWE",
      "NKF2.VWN NKF2.VWE"
    ]
  },
  {
    "path": "EKF2/Mag Innovations Lane1",
    "alternatives": [
      "NKF3[0].IMX NKF2[0].IMY NKF2[0].IMZ NKF3[0].IYAW:2",
      "NKF3.IMX NKF2.IMY NKF2.IMZ NKF3.IYAW:2"
    ]
  },
  {
    "path": "EKF2/Mag Innovations Lane2",
    "alternatives": [
      "NKF3[1].IMX NKF2[1].IMY NKF2[1].IMZ NKF3[1].IYAW:2"
    ]
  },
  {
    "path": "EKF2/Mag Innovations Lane3",
    "alternatives": [
      "NKF3[2].IMX NKF2[2].IMY NKF2[2].IMZ NKF3[2].IYAW:2"
    ]
  },
  {
    "path": "EKF2/Pos Innovations Lane1",
    "alternatives": [
      "NKF3[0].IPN NKF2[0].IPE NKF2[0].IPD",
      "NKF3.IPN NKF2.IPE NKF2.IPD"
    ]
  },
  {
    "path": "EKF2/Pos Innovations Lane2",
    "alternatives": [
      "NKF3[1].IPN NKF2[1].IPE NKF2[1].IPD"
    ]
  },
  {
    "path": "EKF2/Pos Innovations Lane3",
    "alternatives": [
      "NKF3[2].IPN NKF2[2].IPE NKF2[2].IPD"
    ]
  },
  {
    "path": "EKF2/Velocity Innovations Lane1",
    "alternatives": [
      "NKF3[0].IVN NKF2[0].IVE NKF2[0].IVD",
      "NKF3.IVN NKF2.IVE NKF2.IVD"
    ]
  },
  {
    "path": "EKF2/Velocity Innovations Lane2",
    "alternatives": [
      "NKF3[1].IVN NKF2[1].IVE NKF2[1].IVD"
    ]
  },
  {
    "path": "EKF2/Velocity Innovations Lane3",
    "alternatives": [
      "NKF3[2].IVN NKF2[2].IVE NKF2[2].IVD"
    ]
  },
  {
    "path": "EKF2/Normalised Innovations EK2 Lane1",
    "alternatives": [
      "NKF4[0].SV NKF4[0].SP NKF4[0].SH NKF4[0].SM NKF4[0].SVT",
      "NKF4.SV NKF4.SP NKF4.SH NKF4.SM NKF4.SVT"
    ]
  },
  {
    "path": "EKF2/Normalised Innovations EK2 Lane2",
    "alternatives": [
      "NKF4[1].SV NKF4[1].SP NKF4[1].SH NKF4[1].SM NKF4[1].SVT",
      "NKF9.SV NKF9.SP NKF9.SH NKF9.SM NKF9.SVT"
    ]
  },
  {
    "path": "EKF2/Mag Innovations Lane1",
    "alternatives": [
      "NKF3[0].IMX NKF3[0].IMY NKF3[0].IMZ NKF3[0].IYAW:2"
    ]
  },
  {
    "path": "EKF2/Mag Innovations Lane2",
    "alternatives": [
      "NKF3[1].IMX NKF3[1].IMY NKF3[1].IMZ NKF3[1].IYAW:2"
    ]
  },
  {
    "path": "EKF2/Mag Innovations Lane3",
    "alternatives": [
      "NKF3[2].IMX NKF3[2].IMY NKF3[2].IMZ NKF3[2].IYAW:2"
    ]
  },
  {
    "path": "EKF2/Wind Speed and Direction",
    "alternatives": [
      "sqrt(NKF2[0].VWN**2+NKF2[0].VWE**2) wrap_360(degrees(atan2(-NKF2[0].VWE,-NKF2[0].VWN))):2 sqrt(NKF2[1].VWN**2+NKF2[1].VWE**2) wrap_360(degrees(atan2(-NKF2[1].VWE,-NKF2[1].VWN))):2",
      "sqrt(NKF2.VWN**2+NKF2.VWE**2) wrap_360(degrees(atan2(-NKF2.VWE,-NKF2.VWN))):2 sqrt(NKF7.VWN**2+NKF7.VWE**2) wrap_360(degrees(atan2(-NKF7.VWE,-NKF7.VWN))):2"
    ]
  },
  {
    "path": "EKF2/Solution Status",
    "alternatives": [
      "NKF4[0].SS NKF4[1].SS NKF4[2].SS",
      "NKF4[0].SS NKF4[1].SS",
      "NKF4.SS NKF9.SS",
      "NKF4.SS"
    ]
  },
  {
    "path": "EKF2/GPS Check Status",
    "alternatives": [
      "NKF4[0].GPS NKF4[1].GPS NKF4[2].GPS",
      "NKF4[0].GPS NKF4[1].GPS",
      "NKF4.GPS NKF9.GPS",
      "NKF4.GPS"
    ]
  },
  {
    "path": "EKF2/Optical Flow Innovations",
    "alternatives": [
      "NKF5[0].FIX NKF5[0].FIY NKF5[0].AFI",
      "NKF5.FIX NKF5.FIY NKF5.AFI"
    ]
  },
  {
    "path": "EKF2/Rangefinder Innovations",
    "alternatives": [
      "NKF5[0].RI NKF5[1].RI NKF5[2].RI",
      "NKF5[0].RI NKF5[1].RI",
      "NKF5.RI"
    ]
  },
  {
    "path": "EKF2/Magnetometer Selection",
    "alternatives": [
      "NKF2[0].MI NKF2[1].MI NKF2[2].MI",
      "NKF2[0].MI NKF2[1].MI",
      "NKF2.MI NKF7.MI",
      "NKF2.MI"
    ]
  },
  {
    "path": "EKF2/Primary Core",
    "alternatives": [
      "NKF4.PI"
    ]
  },
  {
    "path": "EKF3/Gyro Bias",
    "alternatives": [
      "XKF1[0].GX XKF1[0].GY XKF1[0].GZ XKF1[1].GX XKF1[1].GY XKF1[1].GZ XKF1[2].GX XKF1[2].GY XKF1[2].GZ",
      "XKF1[0].GX XKF1[0].GY XKF1[0].GZ XKF1[1].GX XKF1[1].GY XKF1[1].GZ",
      "XKF1.GX XKF1.GY XKF1.GZ"
    ]
  },
  {
    "path": "EKF3/Origin Height",
    "alternatives": [
      "XKF1[0].OH XKF1[1].OH XKF1[2].OH",
      "XKF1[0].OH XKF1[1].OH",
      "XKF1.OH"
    ]
  },
  {
    "path": "EKF3/Pos D",
    "alternatives": [
      "XKF1[0].PD XKF1[1].PD XKF1[2].PD",
      "XKF1[0].PD XKF1[1].PD",
      "XKF1.PD"
    ]
  },
  {
    "path": "EKF3/Pos NE",
    "alternatives": [
      "XKF1[0].PN XKF1[1].PN XKF1[2].PN XKF1[0].PE XKF1[1].PE XKF1[2].PE",
      "XKF1[0].PN XKF1[1].PN XKF1[0].PE XKF1[1].PE",
      "XKF1.PN XKF1.PE"
    ]
  },
  {
    "path": "EKF3/Pos D",
    "alternatives": [
      "XKF1[0].PD XKF1[1].PD XKF1[2].PD",
      "XKF1[0].PD XKF1[1].PD",
      "XKF1.PD"
    ]
  },
  {
    "path": "EKF3/Position Innovation NE",
    "alternatives": [
      "XKF3[0].IPN XKF3[1].IPN XKF3[2].IPN XKF3[0].IPE XKF3[1].IPE XKF3[2].IPE",
      "XKF3[0].IPN XKF3[1].IPN XKF3[0].IPE XKF3[1].IPE",
      "XKF3.IPN XKF3.IPE"
    ]
  },
  {
    "path": "EKF3/Position Innovation Down",
    "alternatives": [
      "XKF3[0].IPD XKF3[1].IPD XKF3[2].IPD",
      "XKF3[0].IPD XKF3[1].IPD",
      "XKF3.IPD"
    ]
  },
  {
    "path": "EKF3/Velocity Innovation NE",
    "alternatives": [
      "XKF3[0].IVN XKF3[1].IVN XKF3[2].IVN XKF3[0].IVE XKF3[1].IVE XKF3[2].IVE",
      "XKF3[0].IVN XKF3[1].IVN XKF3[0].IVE XKF3[1].IVE",
      "XKF3.IVN XKF3.IVE"
    ]
  },
  {
    "path": "EKF3/Velocity Innovation Down",
    "alternatives": [
      "XKF3[0].IVD XKF3[1].IVD XKF3[2].IVD",
      "XKF3[0].IVD XKF3[1].IVD",
      "XKF3.IVD"
    ]
  },
  {
    "path": "EKF3/Mag Innovations Lane1",
    "alternatives": [
      "XKF3[0].IMX XKF3[0].IMY XKF3[0].IMZ XKF3[0].IYAW:2"
    ]
  },
  {
    "path": "EKF3/Mag Innovations Lane2",
    "alternatives": [
      "XKF3[1].IMX XKF3[1].IMY XKF3[1].IMZ XKF3[1].IYAW:2"
    ]
  },
  {
    "path": "EKF3/Mag Innovations Lane3",
    "alternatives": [
      "XKF3[2].IMX XKF3[2].IMY XKF3[2].IMZ XKF3[2].IYAW:2"
    ]
  },
  {
    "path": "EKF3/Euler Roll",
    "alternatives": [
      "ATT.Roll XKF1[0].Roll XKF1[1].Roll XKF1[2].Roll",
      "ATT.Roll XKF1[0].Roll XKF1[1].Roll",
      "ATT.Roll XKF1.Roll"
    ]
  },
  {
    "path": "EKF3/Euler Pitch",
    "alternatives": [
      "ATT.Pitch XKF1[0].Pitch XKF1[1].Pitch XKF1[2].Pitch",
      "ATT.Pitch XKF1[0].Pitch XKF1[1].Pitch",
      "ATT.Pitch XKF1.Pitch"
    ]
  },
  {
    "path": "EKF3/Euler Yaw",
    "alternatives": [
      "ATT.Yaw XKF1[0].Yaw XKF1[1].Yaw XKF1[2].Yaw",
      "ATT.Yaw XKF1[0].Yaw XKF1[1].Yaw",
      "ATT.Yaw XKF1.Yaw"
    ]
  },
  {
    "path": "EKF3/Velocity N",
    "alternatives": [
      "XKF1[0].VN XKF1[1].VN XKF1[2].VN",
      "XKF1[0].VN XKF1[1].VN",
      "XKF1.VN"
    ]
  },
  {
    "path": "EKF3/Velocity E",
    "alternatives": [
      "XKF1[0].VE XKF1[1].VE XKF1[2].VE",
      "XKF1[0].VE XKF1[1].VE",
      "XKF1.VE"
    ]
  },
  {
    "path": "EKF3/Velocity D",
    "alternatives": [
      "XKF1[0].VD XKF1[1].VD XKF1[2].VD",
      "XKF1[0].VD XKF1[1].VD",
      "XKF1.VD"
    ]
  },
  {
    "path": "EKF3/Velocity dDP",
    "alternatives": [
      "XKF1[0].dPD XKF1[1].dPD XKF1[2].dPD",
      "XKF1[0].dPD XKF1[1].dPD",
      "XKF1.dPD"
    ]
  },
  {
    "path": "EKF3/Accel Bias Lane1",
    "alternatives": [
      "XKF2[0].AX XKF2[0].AY XKF2[0].AZ",
      "XKF2.AX XKF2.AY XKF2.AZ"
    ]
  },
  {
    "path": "EKF3/Accel Bias Lane2",
    "alternatives": [
      "XKF2[1].AX XKF2[1].AY XKF2[1].AZ"
    ]
  },
  {
    "path": "EKF3/Accel Bias Lane3",
    "alternatives": [
      "XKF2[2].AX XKF2[2].AY XKF2[2].AZ"
    ]
  },
  {
    "path": "EKF3/Gyro Scale Factor",
    "alternatives": [
      "XKF2[0].GSX XKF2[0].GSY XKF2[0].GSZ XKF2[1].GSX XKF2[1].GSY XKF2[1].GSZ XKF2[2].GSX XKF2[2].GSY XKF2[2].GSZ",
      "XKF2[0].GSX XKF2[0].GSY XKF2[0].GSZ XKF2[1].GSX XKF2[1].GSY XKF2[1].GSZ",
      "XKF2.GSX XKF2.GSY XKF2.GSZ"
    ]
  },
  {
    "path": "EKF3/Mag Earth Field",
    "alternatives": [
      "XKF2[0].MN XKF2[0].ME XKF2[0].MD XKF2[1].MN XKF2[1].ME XKF2[1].MD XKF2[2].MN XKF2[2].ME XKF2[2].MD",
      "XKF2[0].MN XKF2[0].ME XKF2[0].MD XKF2[1].MN XKF2[1].ME XKF2[1].MD",
      "XKF2.MN XKF2.ME XKF2.MD"
    ]
  },
  {
    "path": "EKF3/Mag Body Field",
    "alternatives": [
      "XKF2[0].MX XKF2[0].MY XKF2[0].MZ XKF2[1].MX XKF2[1].MY XKF2[1].MZ XKF2[2].MX XKF2[2].MY XKF2[2].MZ",
      "XKF2[0].MX XKF2[0].MY XKF2[0].MZ XKF2[1].MX XKF2[1].MY XKF2[1].MZ",
      "XKF2.MX XKF2.MY XKF2.MZ"
    ]
  },
  {
    "path": "EKF3/Wind NE",
    "alternatives": [
      "XKF2[0].VWN XKF2[0].VWE XKF2[1].VWN XKF2[1].VWE XKF2[2].VWN XKF2[2].VWE",
      "XKF2[0].VWN XKF2[0].VWE XKF2[1].VWN XKF2[1].VWE",
      "XKF2.VWN XKF2.VWE"
    ]
  },
  {
    "path": "EKF3/Mag Innovations Lane1",
    "alternatives": [
      "XKF3[0].IMX XKF2[0].IMY XKF2[0].IMZ XKF3[0].IYAW:2",
      "XKF3.IMX XKF2.IMY XKF2.IMZ XKF3.IYAW:2"
    ]
  },
  {
    "path": "EKF3/Mag Innovations Lane2",
    "alternatives": [
      "XKF3[1].IMX XKF2[1].IMY XKF2[1].IMZ XKF3[1].IYAW:2"
    ]
  },
  {
    "path": "EKF3/Mag Innovations Lane3",
    "alternatives": [
      "XKF3[2].IMX XKF2[2].IMY XKF2[2].IMZ XKF3[2].IYAW:2"
    ]
  },
  {
    "path": "EKF3/Pos Innovations Lane1",
    "alternatives": [
      "XKF3[0].IPN XKF2[0].IPE XKF2[0].IPD",
      "XKF3.IPN XKF2.IPE XKF2.IPD"
    ]
  },
  {
    "path": "EKF3/Pos Innovations Lane2",
    "alternatives": [
      "XKF3[1].IPN XKF2[1].IPE XKF2[1].IPD"
    ]
  },
  {
    "path": "EKF3/Pos Innovations Lane3",
    "alternatives": [
      "XKF3[2].IPN XKF2[2].IPE XKF2[2].IPD"
    ]
  },
  {
    "path": "EKF3/Velocity Innovations Lane1",
    "alternatives": [
      "XKF3[0].IVN XKF2[0].IVE XKF2[0].IVD",
      "XKF3.IVN XKF2.IVE XKF2.IVD"
    ]
  },
  {
    "path": "EKF3/Velocity Innovations Lane2",
    "alternatives": [
      "XKF3[1].IVN XKF2[1].IVE XKF2[1].IVD"
    ]
  },
  {
    "path": "EKF3/Velocity Innovations Lane3",
    "alternatives": [
      "XKF3[2].IVN XKF2[2].IVE XKF2[2].IVD"
    ]
  },
  {
    "path": "EKF3/Normalised Innovations EK3 Lane1",
    "alternatives": [
      "XKF4[0].SV XKF4[0].SP XKF4[0].SH XKF4[0].SM XKF4[0].SVT",
      "XKF4.SV XKF4.SP XKF4.SH XKF4.SM XKF4.SVT"
    ]
  },
  {
    "path": "EKF3/Normalised Innovations EK3 Lane2",
    "alternatives": [
      "XKF4[1].SV XKF4[1].SP XKF4[1].SH XKF4[1].SM XKF4[1].SVT",
      "XKF9.SV XKF9.SP XKF9.SH XKF9.SM XKF9.SVT"
    ]
  },
  {
    "path": "EKF3/Wind Speed and Direction",
    "alternatives": [
      "sqrt(XKF2[0].VWN**2+XKF2[0].VWE**2) wrap_360(degrees(atan2(-XKF2[0].VWE,-XKF2[0].VWN))):2 sqrt(XKF2[1].VWN**2+XKF2[1].VWE**2) wrap_360(degrees(atan2(-XKF2[1].VWE,-XKF2[1].VWN))):2",
      "sqrt(XKF2.VWN**2+XKF2.VWE**2) wrap_360(degrees(atan2(-XKF2.VWE,-XKF2.VWN))):2 sqrt(XKF7.VWN**2+XKF7.VWE**2) wrap_360(degrees(atan2(-XKF7.VWE,-XKF7.VWN))):2"
    ]
  },
  {
    "path": "EKF3/Solution Status",
    "alternatives": [
      "XKF4[0].SS XKF4[1].SS XKF4[2].SS",
      "XKF4[0].SS XKF4[1].SS",
      "XKF4.SS XKF9.SS",
      "XKF4.SS"
    ]
  },
  {
    "path": "EKF3/GPS Check Status",
    "alternatives": [
      "XKF4[0].GPS XKF4[1].GPS XKF4[2].GPS",
      "XKF4[0].GPS XKF4[1].GPS",
      "XKF4.GPS XKF9.GPS",
      "XKF4.GPS"
    ]
  },
  {
    "path": "EKF3/Optical Flow Innovations",
    "alternatives": [
      "XKF5[0].FIX XKF5[0].FIY XKF5[0].AFI",
      "XKF5.FIX XKF5.FIY XKF5.AFI"
    ]
  },
  {
    "path": "EKF3/Rangefinder Innovations",
    "alternatives": [
      "XKF5[0].RI XKF5[1].RI XKF5[2].RI",
      "XKF5[0].RI XKF5[1].RI",
      "XKF5.RI"
    ]
  },
  {
    "path": "EKF3/Magnetometer Selection",
    "alternatives": [
      "XKF2[0].MI XKF2[1].MI XKF2[2].MI",
      "XKF2[0].MI XKF2[1].MI",
      "XKF2.MI XKF7.MI",
      "XKF2.MI"
    ]
  },
  {
    "path": "EKF3/Primary Core",
    "alternatives": [
      "XKF4.PI"
    ]
  },
  {
    "path": "EKF3/Error Scores",
    "alternatives": [
      "XKF3[0].ErSc XKF3[1].ErSc XKF3[2].ErSc XKF4.PI:2",
      "XKF3[0].ErSc XKF3[1].ErSc XKF4.PI:2",
      "XKF3.ErSc XKF4.PI:2"
    ]
  },
  {
    "path": "EKF3/Relative Errors",
    "alternatives": [
      "XKF3[0].RErr XKF3[1].RErr XKF3[2].RErr XKF4.PI:2",
      "XKF3[0].RErr XKF3[1].RErr XKF4.PI:2",
      "XKF3.RErr XKF4.PI:2"
    ]
  }
];
