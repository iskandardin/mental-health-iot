const { firebaseHelpers } = require('../services/firebase');
const logger = require('../services/logger');

// Available interventions
const INTERVENTIONS = [
  {
    id: 'breathing-4-7-8',
    name: 'Breathing Exercise (4-7-8)',
    category: 'breathing',
    duration: 5,
    description: 'Calming breathing technique: inhale for 4, hold for 7, exhale for 8',
    effectiveness: 0.85,
    instructions: [
      'Exhale completely',
      'Inhale for 4 counts',
      'Hold for 7 counts',
      'Exhale for 8 counts',
      'Repeat 4 times'
    ]
  },
  {
    id: 'progressive-muscle-relaxation',
    name: 'Progressive Muscle Relaxation',
    category: 'relaxation',
    duration: 15,
    description: 'Systematically tense and relax muscle groups',
    effectiveness: 0.80,
    instructions: [
      'Start with your feet',
      'Tense for 5 seconds',
      'Release and relax for 5 seconds',
      'Move up through your body'
    ]
  },
  {
    id: 'meditation-mindfulness',
    name: 'Mindfulness Meditation',
    category: 'meditation',
    duration: 10,
    description: 'Focus on the present moment and your breath',
    effectiveness: 0.88,
    instructions: [
      'Find a comfortable position',
      'Close your eyes',
      'Focus on your natural breathing',
      'When your mind wanders, gently bring it back'
    ]
  },
  {
    id: 'music-therapy',
    name: 'Music Therapy',
    category: 'music',
    duration: 20,
    description: 'Listen to calming music to reduce stress',
    effectiveness: 0.75,
    musicPlaylists: [
      'Ambient Relaxation',
      'Classical Piano',
      'Nature Sounds',
      'Binaural Beats'
    ]
  },
  {
    id: 'journaling',
    name: 'Emotional Journaling',
    category: 'journaling',
    duration: 15,
    description: 'Write about your feelings and thoughts',
    effectiveness: 0.72,
    prompts: [
      'What is making me stressed right now?',
      'What can I do about it?',
      'What is one thing I am grateful for today?'
    ]
  },
  {
    id: 'physical-exercise',
    name: 'Light Physical Exercise',
    category: 'exercise',
    duration: 10,
    description: 'Quick stretches or light movement',
    effectiveness: 0.82,
    exercises: [
      'Neck rolls',
      'Shoulder shrugs',
      'Arm stretches',
      'Walking in place',
      'Jumping jacks'
    ]
  }
];

const interventionController = {
  async getInterventions(req, res) {
    try {
      res.json({
        success: true,
        interventions: INTERVENTIONS
      });
    } catch (error) {
      logger.error('Get interventions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve interventions'
      });
    }
  },

  async getRecommendations(req, res) {
    try {
      const { stressScore } = req.query;
      const userId = req.userId;

      let recommendations = [];

      if (stressScore < 40) {
        recommendations = INTERVENTIONS.filter(i => i.category === 'meditation');
      } else if (stressScore < 70) {
        recommendations = INTERVENTIONS.filter(i => 
          ['breathing', 'relaxation', 'music'].includes(i.category)
        );
      } else {
        recommendations = INTERVENTIONS.filter(i => 
          ['breathing', 'relaxation', 'exercise'].includes(i.category)
        );
      }

      res.json({
        success: true,
        recommendations
      });
    } catch (error) {
      logger.error('Get recommendations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve recommendations'
      });
    }
  },

  async logIntervention(req, res) {
    try {
      const { interventionId, duration, effectiveness } = req.body;
      const userId = req.userId;

      if (!interventionId) {
        return res.status(400).json({
          success: false,
          message: 'Intervention ID is required'
        });
      }

      const intervention = INTERVENTIONS.find(i => i.id === interventionId);
      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervention not found'
        });
      }

      const logId = await firebaseHelpers.logIntervention(userId, {
        interventionId,
        interventionName: intervention.name,
        category: intervention.category,
        duration: duration || intervention.duration,
        effectiveness: effectiveness || 5,
        userFeedback: req.body.feedback || ''
      });

      res.status(201).json({
        success: true,
        message: 'Intervention logged successfully',
        logId
      });
    } catch (error) {
      logger.error('Log intervention error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to log intervention'
      });
    }
  },

  async getHistory(req, res) {
    try {
      const { limit = 100 } = req.query;
      const userId = req.userId;

      const history = await firebaseHelpers.getInterventionHistory(userId, parseInt(limit));

      res.json({
        success: true,
        history,
        count: history.length
      });
    } catch (error) {
      logger.error('Get history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve intervention history'
      });
    }
  },

  async rateIntervention(req, res) {
    try {
      const { interventionId } = req.params;
      const { rating } = req.body;
      const userId = req.userId;

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Log the rating
      await firebaseHelpers.logIntervention(userId, {
        interventionId,
        type: 'rating',
        rating,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Rating saved successfully'
      });
    } catch (error) {
      logger.error('Rate intervention error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to rate intervention'
      });
    }
  }
};

module.exports = interventionController;
