export const useInterventions = () => ({
  interventions: [{id: '1', status: 'pending'}],
  loading: false,
  error: null,
  createIntervention: (_: any) => Promise.resolve(),
  updateIntervention: () => Promise.resolve(),
  deleteIntervention: () => Promise.resolve()
})